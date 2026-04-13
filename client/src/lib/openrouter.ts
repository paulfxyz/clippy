/**
 * @file openrouter.ts
 * @description OpenRouter API client for Clippy.
 *
 * OpenRouter (https://openrouter.ai) is a unified API gateway that routes
 * requests to 100+ AI models from different providers (Anthropic, OpenAI,
 * Google, Meta, Mistral, DeepSeek, etc.) through a single standardized
 * OpenAI-compatible API.
 *
 * This module exports:
 *   - AVAILABLE_MODELS: the model registry shown in the UI selection grid
 *   - analyzeWithModel(): the core function that calls OpenRouter and parses results
 *   - SYSTEM_PROMPT: the instruction set that tells models what to analyze and how
 *
 * Architecture note: these API calls are made directly from the user's browser.
 * OpenRouter explicitly allows CORS for browser-based API calls.
 * No server proxy is needed or used.
 */

import type { ClauseFlag, Dimension, ModelResult } from "@shared/schema";

// ---------------------------------------------------------------------------
// Model registry
// ---------------------------------------------------------------------------

/**
 * Pre-configured model options shown in the model selection grid.
 *
 * To add a new model:
 * 1. Find its ID at https://openrouter.ai/models
 * 2. Add an entry below with the fields defined here
 * 3. That's it — the UI will automatically render it
 *
 * Model IDs follow the format "provider/model-name" as defined by OpenRouter.
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
 * The instruction set sent to every model as the `system` message.
 *
 * Design decisions:
 *
 * 1. JSON output enforcement: We request `response_format: { type: "json_object" }`
 *    for models that support it (OpenAI models). For others, we instruct the model
 *    to return ONLY valid JSON in the prompt itself. The response parser has a
 *    fallback to strip markdown code fences.
 *
 * 2. Five dimensions: Transparency, Balance, Legal Compliance, Financial Risk,
 *    Exit Freedom. These were chosen to cover the most common contract failure modes
 *    that affect ordinary users (not corporations with legal teams).
 *
 * 3. Severity thresholds: CRITICAL/SUSPECT/MINOR are defined clearly to reduce
 *    model hallucination of severity. Without clear definitions, models tend to
 *    mark everything CRITICAL (alarm fatigue) or everything MINOR (useless).
 *
 * 4. Temperature: Set to 0.1 in analyzeWithModel(). Low temperature = more
 *    deterministic = more consistent legal analysis across runs.
 *
 * 5. "Only flag genuine issues": Without this instruction, models tend to flag
 *    standard boilerplate as problematic. We want signal, not noise.
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
 * This function:
 * 1. Constructs the OpenRouter API request with the system prompt + contract text
 * 2. Optionally prepends the user's custom instructions before the contract
 * 3. Parses the JSON response (with fallback for models that wrap JSON in markdown)
 * 4. Clamps the trustScore to [0, 100] to handle model output drift
 * 5. Throws a descriptive error on failure — the caller handles per-model error state
 *
 * @param contractText - Plain text content of the contract to analyze
 * @param modelId - OpenRouter model ID (e.g. "anthropic/claude-3.5-sonnet")
 * @param apiKey - User's OpenRouter API key (passed at runtime, never stored)
 * @param customPrompt - Optional additional instructions appended before the contract text
 * @returns The parsed analysis result (minus modelId/modelName/status which the caller adds)
 * @throws Error with a human-readable message if the API call or parsing fails
 */
export async function analyzeWithModel(
  contractText: string,
  modelId: string,
  apiKey: string,
  customPrompt?: string
): Promise<Omit<ModelResult, "modelId" | "modelName" | "status">> {

  // Build the user message. Custom prompt (if provided) goes first,
  // giving it higher priority in the model's attention than the contract text.
  const userPrompt = customPrompt
    ? `${customPrompt}\n\nContract text:\n\n${contractText}`
    : `Please analyze this contract:\n\n${contractText}`;

  // Make the API call directly from the browser.
  // OpenRouter's CORS policy allows this for all origins.
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      // Bearer token auth — the user's own key, paid by the user
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // OpenRouter asks for these headers to track usage by app name.
      // They are informational only and don't affect routing or pricing.
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
      // Higher values produce more "creative" but less reliable flagging.
      temperature: 0.1,
      // JSON mode: tells OpenRouter to request structured output from models
      // that support it (primarily OpenAI-compatible models). For others,
      // the instruction in SYSTEM_PROMPT serves as the fallback.
      response_format: { type: "json_object" },
    }),
  });

  // Handle non-2xx responses — extract OpenRouter's error message
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();

  // Extract the model's text response from the OpenAI-compatible response format
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from model");

  // ---------------------------------------------------------------------------
  // JSON parsing with fallback
  //
  // Even with response_format: { type: "json_object" }, some models (especially
  // open-source ones routed through OpenRouter) wrap their JSON output in markdown
  // code fences like:
  //   ```json
  //   { "trustScore": 72, ... }
  //   ```
  //
  // The fallback strips these fences before parsing.
  // ---------------------------------------------------------------------------
  let parsed: any;
  try {
    const cleaned = content
      .replace(/^```json?\n?/, "") // strip opening ```json or ``` fence
      .replace(/\n?```$/, "")     // strip closing ``` fence
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Model returned invalid JSON — try a different model or a shorter contract");
  }

  return {
    // Clamp trust score to [0, 100] — models occasionally return values like 102 or -5
    trustScore: Math.max(0, Math.min(100, Number(parsed.trustScore) || 50)),
    summary: String(parsed.summary || "No summary provided."),
    jurisdiction: String(parsed.jurisdiction || "Unknown"),
    flags: (parsed.flags || []) as ClauseFlag[],
    dimensions: (parsed.dimensions || []) as Dimension[],
  };
}
