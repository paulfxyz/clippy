/**
 * @file openrouter.ts
 * @description OpenRouter API client for Clippy v2.0.0.
 *
 * OpenRouter (https://openrouter.ai) is a unified API gateway that routes
 * requests to 100+ AI models from different providers (Anthropic, OpenAI,
 * Google, Meta, Mistral, DeepSeek, etc.) through a single standardized
 * OpenAI-compatible API.
 *
 * WHAT CHANGED IN v2.0.0
 * -----------------------
 * v1.0.0 accepted a single optional `customPrompt?: string` parameter.
 * v2.0.0 accepts an `AnalysisPrompt[]` array instead. This allows users to:
 *   - Enable/disable individual objectives from the curated prompt library
 *   - Edit existing prompt bodies inline
 *   - Add entirely custom objectives
 *
 * The array is assembled into a formatted instruction block by
 * `assemblePromptInstructions()` from prompts.ts and injected into the
 * user message before the contract text.
 *
 * Additionally, v2.0.0 tracks `durationMs` per model (wall-clock time for
 * the API call), which is shown in the results dashboard.
 *
 * CORS STRATEGY
 * -------------
 * All API calls are made directly from the user's browser to OpenRouter's API.
 * OpenRouter explicitly allows CORS for browser-based API calls.
 * No server proxy is needed. This is a core part of Clippy's zero-backend
 * privacy guarantee.
 *
 * JSON OUTPUT STRATEGY
 * --------------------
 * We use `response_format: { type: "json_object" }` for models that support it.
 * For models that don't, the SYSTEM_PROMPT instructs them to return only JSON.
 * The parser has a final fallback to strip Markdown code fences.
 *
 * See SYSTEM_PROMPT below for the full instruction set and design rationale.
 */

import type { AnalysisPrompt, ClauseFlag, Dimension, ModelResult } from "@shared/schema";
import { assemblePromptInstructions } from "@/lib/prompts";

// ---------------------------------------------------------------------------
// Model registry
// ---------------------------------------------------------------------------

/**
 * Pre-configured model options shown in the model selection grid (Step 1).
 *
 * To add a new model:
 * 1. Find its ID at https://openrouter.ai/models
 * 2. Add an entry here with all 5 fields
 * 3. It will automatically appear in the Step 1 model picker
 *
 * Model IDs follow the format "provider/model-name" as defined by OpenRouter.
 *
 * icon: a single character abbreviation for the provider badge (shown in the
 * model chip button when a font icon isn't available)
 */
export const AVAILABLE_MODELS = [
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Best for nuanced legal reasoning — strongest at identifying indirect risks and implicitly one-sided language",
    icon: "A",
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Fast and affordable — good for a quick first pass before running heavier models",
    icon: "A",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Excellent general analysis — reliable JSON output, good at flagging financial risk clauses",
    icon: "O",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast, cost-effective — great as a second opinion alongside a larger model",
    icon: "O",
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini Pro 1.5",
    provider: "Google",
    description: "1M token context window — handles very long contracts that other models truncate",
    icon: "G",
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    description: "Strong EU legal context — particularly good at GDPR, French, and European law nuances",
    icon: "M",
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    provider: "Meta",
    description: "Open-source powerhouse — useful to compare against closed-source models for bias",
    icon: "L",
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    description: "Strong reasoning model — good at multi-step legal logic chains and inconsistency detection",
    icon: "D",
  },
];

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

/**
 * The core instruction set sent to every model as the `system` message.
 *
 * DESIGN DECISIONS
 * ----------------
 *
 * 1. JSON output enforcement
 *    We request `response_format: { type: "json_object" }` for models that
 *    support it (OpenAI-compatible models). For models that ignore it, the
 *    prompt ends with "Return ONLY valid JSON, no markdown, no explanation."
 *    The parser applies a final code-fence strip as a safety net.
 *
 * 2. Five analysis dimensions
 *    Transparency, Balance, Legal Compliance, Financial Risk, Exit Freedom.
 *    These were chosen to cover the most common contract failure modes that
 *    affect ordinary users, not corporations with legal teams. Each dimension
 *    gets a 0–100 score and a brief qualitative note.
 *
 * 3. Severity calibration
 *    CRITICAL / SUSPECT / MINOR are defined with concrete examples to anchor
 *    the model's judgement. Without this, models tend toward either alarm
 *    fatigue (everything CRITICAL) or signal suppression (everything MINOR).
 *
 * 4. Low temperature
 *    analyzeWithModel() sets temperature: 0.1. Low = deterministic = stable
 *    flagging across multiple runs of the same contract. Legal analysis is
 *    not creative writing — we want consistent signal.
 *
 * 5. "Only flag genuine issues"
 *    Without this, models flag standard boilerplate like "this agreement is
 *    governed by the laws of [State]" as SUSPECT. We want signal, not noise.
 *
 * 6. Additional objectives (v2 new)
 *    User-selected analysis objectives from the prompt library are appended
 *    to the user message (not the system message) so they layer additively
 *    on top of this base instruction without overriding the JSON format.
 */
const SYSTEM_PROMPT = `You are Clippy, an expert contract analysis AI. Your job is to analyze contracts and identify potentially problematic clauses that may work against the user's interests.

Analyze the contract text and return a JSON response with this exact structure:
{
  "trustScore": <number 0-100, where 100 is perfectly fair>,
  "summary": "<2-3 sentence plain language summary of the contract and its main risks>",
  "jurisdiction": "<detected jurisdiction or 'Unknown'>",
  "dimensions": [
    {"name": "Transparency", "score": <0-100>, "label": "<one word assessment>", "note": "<brief note>"},
    {"name": "Balance", "score": <0-100>, "label": "<one word assessment>", "note": "<brief note>"},
    {"name": "Legal Compliance", "score": <0-100>, "label": "<one word assessment>", "note": "<brief note>"},
    {"name": "Financial Risk", "score": <0-100>, "label": "<one word assessment>", "note": "<brief note>"},
    {"name": "Exit Freedom", "score": <0-100>, "label": "<one word assessment>", "note": "<brief note>"}
  ],
  "flags": [
    {
      "id": "<unique-id>",
      "title": "<short title>",
      "description": "<clear explanation of why this clause is problematic>",
      "severity": "<CRITICAL|SUSPECT|MINOR>",
      "quote": "<exact short quote from the contract, max 100 chars>"
    }
  ]
}

Severity guide:
- CRITICAL: Clause is clearly abusive, illegal, or severely disadvantages the user (e.g., hidden price escalations, impossible termination windows, unlimited liability)
- SUSPECT: Clause is unusual, one-sided, or could be manipulated against the user
- MINOR: Worth noting but common in contracts; minor inconvenience or restriction

Be thorough but precise. Only flag genuine issues, not standard boilerplate. Return ONLY valid JSON, no markdown, no explanation outside the JSON.`;

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

/**
 * Sends a contract to a specific AI model via OpenRouter and returns the analysis.
 *
 * FLOW
 * ----
 * 1. Assemble the user message from the prompts array + contract text
 * 2. Record start time for duration tracking
 * 3. POST to OpenRouter with the system prompt + assembled user message
 * 4. Parse the JSON response (with fallback for code-fenced responses)
 * 5. Clamp trustScore to [0, 100] to handle model output drift
 * 6. Return the result with durationMs
 *
 * V2 CHANGES FROM v1
 * ------------------
 * - Parameter `customPrompt?: string` → `prompts: AnalysisPrompt[]`
 *   The caller now passes the full prompts array (from AppState.prompts).
 *   Enabled prompts are assembled by assemblePromptInstructions().
 *   This replaces the single freeform text box from v1.
 *
 * - Added `durationMs` field in the return value.
 *   Wall-clock time from request start to parsed response, in milliseconds.
 *   Shown in the results dashboard to let users compare model speed.
 *
 * ERROR HANDLING
 * --------------
 * This function throws a descriptive Error on failure. The caller (Home.tsx)
 * catches per-model errors and updates that model's state to `{ status: "error" }`.
 * One model failing does not abort the other parallel requests.
 *
 * @param contractText - Plain text content of the contract (extracted by fileParser.ts)
 * @param modelId - OpenRouter model ID (e.g. "anthropic/claude-3.5-sonnet")
 * @param apiKey - User's OpenRouter API key (decrypted at call time, never stored)
 * @param prompts - Full prompts array from AppState; only enabled ones are sent
 * @returns Parsed analysis result (caller adds modelId/modelName/status)
 * @throws Error with a human-readable message if the API call or JSON parsing fails
 */
export async function analyzeWithModel(
  contractText: string,
  modelId: string,
  apiKey: string,
  prompts: AnalysisPrompt[] = []
): Promise<Omit<ModelResult, "modelId" | "modelName" | "status">> {

  // Assemble user-selected prompt objectives into a formatted instruction block.
  // If no prompts are enabled, additionalInstructions is an empty string.
  const additionalInstructions = assemblePromptInstructions(prompts);

  // Build the user message. Additional objectives go first (highest priority
  // in model attention), followed by the contract text.
  const userPrompt = additionalInstructions
    ? `${additionalInstructions}\n\nPlease analyze this contract:\n\n${contractText}`
    : `Please analyze this contract:\n\n${contractText}`;

  // Record start time for duration measurement
  const startTime = Date.now();

  // Make the API call directly from the browser.
  // OpenRouter's CORS policy allows browser-to-API calls from any origin.
  // The user's own API key is used — Clippy itself pays nothing.
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      // Bearer token auth — the user's own key, charged to the user's account
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // OpenRouter uses these headers to attribute usage to the app in their dashboard.
      // They're informational only — they don't affect routing, billing, or model access.
      "HTTP-Referer": "https://clippy.legal",
      "X-Title": "Clippy Contract Analyzer",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      // Very low temperature for deterministic legal analysis.
      // Higher values produce more "creative" but less consistent flagging.
      temperature: 0.1,
      // JSON mode: instructs OpenRouter to request structured output from
      // models that support it (primarily OpenAI-compatible models).
      // For other models, the "Return ONLY valid JSON" instruction in
      // SYSTEM_PROMPT acts as the fallback enforcement mechanism.
      response_format: { type: "json_object" },
    }),
  });

  // Capture wall-clock duration immediately after the response arrives
  const durationMs = Date.now() - startTime;

  // Handle non-2xx HTTP responses — extract OpenRouter's error message
  // Common errors: 401 (bad key), 402 (insufficient credits), 429 (rate limit),
  // 503 (model unavailable)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();

  // Extract the model's text response from the OpenAI-compatible envelope
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from model");

  // ---------------------------------------------------------------------------
  // JSON parsing with fallback
  //
  // Even with response_format: { type: "json_object" }, some models (especially
  // open-source ones routed through OpenRouter) wrap their JSON in Markdown
  // code fences:
  //
  //   ```json
  //   { "trustScore": 72, ... }
  //   ```
  //
  // The fallback strips these fences before parsing.
  // If that also fails, we throw a descriptive error — the caller shows it
  // in the per-model error state in the UI.
  // ---------------------------------------------------------------------------
  let parsed: any;
  try {
    const cleaned = content
      .replace(/^```json?\n?/, "")  // strip opening ```json or ``` fence
      .replace(/\n?```$/, "")       // strip closing ``` fence
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Model returned invalid JSON — try a different model or a shorter contract");
  }

  return {
    // Clamp trust score to [0, 100] — models occasionally return values like 102 or -5
    trustScore:  Math.max(0, Math.min(100, Number(parsed.trustScore) || 50)),
    summary:     String(parsed.summary || "No summary provided."),
    jurisdiction: String(parsed.jurisdiction || "Unknown"),
    flags:       (parsed.flags || []) as ClauseFlag[],
    dimensions:  (parsed.dimensions || []) as Dimension[],
    // v2: wall-clock duration for the request, shown in the results dashboard
    durationMs,
  };
}
