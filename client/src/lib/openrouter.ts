/**
 * @file openrouter.ts
 * @description OpenRouter API client for Clippy.
 *
 * OpenRouter (https://openrouter.ai) is a unified API gateway that routes
 * requests to 100+ AI models from different providers (Anthropic, OpenAI,
 * Google, Meta, Mistral, DeepSeek, etc.) through a single standardized
 * OpenAI-compatible API. Users authenticate with their own OpenRouter key —
 * Clippy itself pays nothing and has no server-side API proxy.
 *
 * WHAT CHANGED IN v2.0.0
 * -----------------------
 * v1.0.0 accepted a single optional `customPrompt?: string` parameter.
 * v2.0.0 accepts an `AnalysisPrompt[]` array instead. This allows users to:
 *   - Enable/disable individual objectives from the curated prompt library
 *   - Edit existing prompt bodies inline
 *   - Add entirely custom objectives
 *
 * WHAT CHANGED IN v3.0.1
 * -----------------------
 * - SYSTEM_PROMPT substantially expanded with:
 *     - Richer severity definitions tied to legal thresholds
 *     - Examples of CRITICAL/SUSPECT/MINOR flags grounded in law
 *     - Better JSON schema guidance (explicit field descriptions)
 *     - Instruction to detect jurisdiction from document content
 * - Additional JSON parsing fallback: handles models that output malformed
 *   JSON with trailing commas, leading text, or partial wrapping
 * - More descriptive HTTP error messages for common OpenRouter error codes
 *   (401 bad key, 402 no credits, 429 rate limit, 503 model unavailable)
 *
 * WHAT CHANGED IN v3.0.2
 * -----------------------
 * - analyzeWithModel() now accepts a `locale` parameter.
 *   When a non-English locale is active, a LANGUAGE INSTRUCTION line is
 *   prepended to the system prompt directing the model to produce all
 *   analysis text (summary, flag titles/descriptions, dimension labels/notes)
 *   in that language, while keeping JSON keys and quoted contract excerpts
 *   unchanged.
 * - LOCALE_LANGUAGE_NAMES maps every supported Clippy locale to the full
 *   English language name used in the model instruction.
 * - buildSystemPrompt(locale) dynamically composes the final system prompt.
 *
 * WHAT CHANGED IN v3.3.0
 * -----------------------
 * Driven by a measured benchmark (see bench/ and docs/BENCHMARK.md):
 * - Model registry rebuilt around the current OpenRouter frontier. Three
 *   previously listed models (claude-3.7-sonnet, claude-3.5-haiku,
 *   deepseek-r1) no longer exist on OpenRouter — the old default would have
 *   failed with "No endpoints found". Registry entries now carry measured
 *   price / latency so the UI can show honest expectations.
 * - fetchLiveModelCatalog(): checks the public OpenRouter catalog at start-up
 *   so a retired model is greyed out instead of failing mid-analysis.
 * - JSON mode (`response_format`) is now requested for every model. All 15
 *   benchmarked models accepted it. If a model does reject it we retry once
 *   without it, instead of maintaining a hard-coded allow-list that rots.
 * - One automatic retry on transient provider errors (429 / 502 / 503 / 504).
 * - `finish_reason: "length"` is detected and reported as a truncation error
 *   instead of a cryptic "invalid JSON".
 * - trustScore bug fixed: a legitimate score of 0 used to be shown as 50
 *   (`Number(0) || 50`).
 * - Flag / dimension normalisation: severities are validated, text fields
 *   coerced, flags capped at 20 — a model that returns "High" or null can no
 *   longer break the results UI.
 * - Locale map completed for tr / sv / id (3.2.4 shipped without them, so
 *   Turkish, Swedish and Indonesian users silently received English analyses).
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
 * The parser has two fallback layers:
 *   1. Strip Markdown code fences (```json ... ```)
 *   2. Extract the first valid JSON object from the response using regex
 *
 * See SYSTEM_PROMPT below for the full instruction set and design rationale.
 */

import type { AnalysisPrompt, ClauseFlag, Dimension, ModelResult } from "@shared/schema";
import type { Locale } from "@/lib/i18n";
import { assemblePromptInstructions } from "@/lib/prompts";

// ---------------------------------------------------------------------------
// Locale → language name mapping
// ---------------------------------------------------------------------------

/**
 * Maps every supported Clippy locale code to the full English language name
 * used in the model's language instruction.
 *
 * We use English names (not native names) because LLMs respond more reliably
 * to English language names in system prompts.
 */
export const LOCALE_LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  de: "German",
  nl: "Dutch",
  it: "Italian",
  zh: "Chinese (Simplified)",
  ru: "Russian",
  hi: "Hindi",
  bg: "Bulgarian",
  pl: "Polish",
  da: "Danish",
  ja: "Japanese",
  ko: "Korean",
  he: "Hebrew",
  ar: "Arabic",
  tr: "Turkish",
  sv: "Swedish",
  id: "Indonesian",
};

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
 * model chip button when a font icon isn't available).
 *
 * description: shown in the model card tooltip. Should capture the model's
 * specific strength for contract analysis use cases.
 */
export interface ModelInfo {
  /** OpenRouter model ID ("provider/model-name"). */
  id: string;
  /** Short display name. */
  name: string;
  provider: string;
  /** English-only fallback description (the UI shows the localised `tag`). */
  description: string;
  /** Single-character provider badge. */
  icon: string;
  /** i18n key suffix → t(`model.tag.${tag}`). */
  tag: "balanced" | "fast" | "deep" | "budget" | "longctx" | "eu" | "alt";
  /** Approx. USD per analysis of a ~10-page contract (measured, see docs/BENCHMARK.md). */
  costPerAnalysis: number;
  /** Mean wall-clock seconds over the two benchmark runs. */
  seconds: number;
  /** Context window in tokens. */
  context: number;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: "anthropic/claude-sonnet-5.5",
    name: "Claude Sonnet 5.5",
    provider: "Anthropic",
    description: "Best all-round pick — found all 10 planted problems, quoted the contract verbatim every time, and answered in under 20 seconds",
    icon: "A", tag: "balanced", costPerAnalysis: 0.038, seconds: 19, context: 1_000_000,
  },
  {
    id: "openai/gpt-6.1-terra",
    name: "GPT-6.1 Terra",
    provider: "OpenAI",
    description: "Newest OpenAI model — found all 10 planted problems at roughly a quarter of Sonnet's price, with concise, valid JSON every time",
    icon: "O", tag: "balanced", costPerAnalysis: 0.009, seconds: 21, context: 1_050_000,
  },
  {
    id: "google/gemini-4-argon",
    name: "Gemini 4 Argon",
    provider: "Google",
    description: "1M-token context — the safe choice for very long contracts (100+ pages)",
    icon: "G", tag: "longctx", costPerAnalysis: 0.022, seconds: 27, context: 1_048_576,
  },
  {
    id: "anthropic/claude-haiku-5.5",
    name: "Claude Haiku 5.5",
    provider: "Anthropic",
    description: "Fast and almost free — matched the flagships on planted-clause detection at a small fraction of their cost",
    icon: "A", tag: "fast", costPerAnalysis: 0.0035, seconds: 26, context: 1_000_000,
  },
  {
    id: "mistralai/mistral-large-4-0",
    name: "Mistral Large 4",
    provider: "Mistral",
    description: "European provider — a useful second opinion on GDPR and civil-law structures; the only model to use the top severity on our real-world excerpt",
    icon: "M", tag: "eu", costPerAnalysis: 0.028, seconds: 51, context: 1_048_576,
  },
  {
    id: "deepseek/deepseek-v4.1-flash-1017",
    name: "DeepSeek V4.1 Flash",
    provider: "DeepSeek",
    description: "Budget pick — found all 10 planted problems for a fraction of a cent per analysis",
    icon: "D", tag: "budget", costPerAnalysis: 0.0025, seconds: 38, context: 1_048_576,
  },
  {
    id: "x-ai/grok-4.7",
    name: "Grok 4.7",
    provider: "xAI",
    description: "A different training lineage — useful as an independent third opinion",
    icon: "X", tag: "alt", costPerAnalysis: 0.032, seconds: 67, context: 500_000,
  },
  {
    id: "anthropic/claude-opus-5.5",
    name: "Claude Opus 5.5",
    provider: "Anthropic",
    description: "Deep review — flagged more items than most models in our tests; use it on contracts that really matter",
    icon: "A", tag: "deep", costPerAnalysis: 0.11, seconds: 39, context: 1_000_000,
  },
];

/** Models pre-selected for a new session (cheap, fast, different vendors). */
export const DEFAULT_MODEL_IDS = ["anthropic/claude-sonnet-5.5", "openai/gpt-6.1-terra"];

// ---------------------------------------------------------------------------
// Live catalogue check
// ---------------------------------------------------------------------------

/**
 * Asks OpenRouter which model IDs currently exist.
 *
 * Why: model IDs retire without warning (this is what produced the
 * "No endpoints found for anthropic/claude-3.5-sonnet" failures in v3.1/3.2).
 * The endpoint is public and needs no API key, and it is the same host the
 * analysis calls already go to, so it adds no new third party.
 *
 * Fail-open: on any network/parse error we return null and the UI treats
 * every model as available.
 */
export async function fetchLiveModelCatalog(): Promise<Set<string> | null> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch("https://openrouter.ai/api/v1/models", { signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const j = await r.json();
    if (!Array.isArray(j?.data)) return null;
    return new Set<string>(j.data.map((m: { id: string }) => m.id));
  } catch {
    return null;
  }
}

/** Per-request timeout. Every picker model finished well inside this in testing. */
export const REQUEST_TIMEOUT_MS = 120_000;

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
 *    The parser applies fallback code-fence stripping + JSON extraction.
 *
 * 2. Five analysis dimensions
 *    Transparency, Balance, Legal Compliance, Financial Risk, Exit Freedom.
 *    These were chosen to cover the most common contract failure modes that
 *    affect ordinary users, not corporations with legal teams. Each dimension
 *    gets a 0–100 score and a brief qualitative note.
 *
 *    - Transparency: are terms legible, clear, and not buried in cross-references?
 *    - Balance: are rights and obligations roughly symmetrical?
 *    - Legal Compliance: would any clause likely be void or challenged under
 *      applicable consumer or employment law?
 *    - Financial Risk: are the financial obligations clear, capped, and proportionate?
 *    - Exit Freedom: how easily can the weaker party exit? Are exit costs fair?
 *
 * 3. Severity calibration with legal anchoring
 *    CRITICAL / SUSPECT / MINOR are defined with concrete legal examples to
 *    anchor the model's judgement. Without this, models tend toward either
 *    alarm fatigue (everything CRITICAL) or signal suppression (everything MINOR).
 *
 *    CRITICAL examples: mandatory arbitration + class-action waiver in a consumer
 *    contract; GDPR lawful basis entirely absent; auto-renewal with no cancellation
 *    right; unlimited liability on user's side with no cap.
 *
 *    SUSPECT examples: governing law clause that would strip consumer protections;
 *    non-compete with no compensation (required in France and Germany); unilateral
 *    modification right with notice but no exit option.
 *
 *    MINOR examples: standard limitation of liability; 30-day payment terms;
 *    governing law of vendor's home state in a B2B contract.
 *
 * 4. Low temperature
 *    analyzeWithModel() sets temperature: 0.1. Low = deterministic = stable
 *    flagging across multiple runs of the same contract. Legal analysis is
 *    not creative writing — we want consistent signal.
 *
 * 5. "Only flag genuine issues"
 *    Without this instruction, models flag standard boilerplate (e.g., "this
 *    agreement is governed by the laws of [State]") as SUSPECT. We want signal,
 *    not noise. This instruction significantly reduces false positives.
 *
 * 6. Jurisdiction detection
 *    The model is instructed to identify the applicable jurisdiction from
 *    internal contract cues (explicit choice-of-law clause, company registration
 *    mentions, language/currency used). This feeds the `jurisdiction` field
 *    shown in the UI and used in the export.
 *
 * 7. Additional objectives (v2+)
 *    User-selected analysis objectives from the prompt library are appended
 *    to the USER message (not the system message). This preserves JSON format
 *    compliance while layering additional analysis instructions.
 */
/**
 * Base system prompt — language-neutral.
 * A LANGUAGE INSTRUCTION line is prepended at runtime by buildSystemPrompt()
 * when the active locale is not English.
 */
const SYSTEM_PROMPT_BASE = `You are Clippy, an expert contract analysis AI with deep knowledge of consumer protection law, employment law, data privacy regulation, and intellectual property law across multiple jurisdictions (EU, US, UK, France, Germany, and others).

Your job is to analyse contracts and identify clauses that may be problematic, unfair, abusive, or legally questionable — particularly clauses that disadvantage the party who did not draft the contract (typically the consumer, employee, or smaller business partner).

LEGAL FRAMEWORK
---------------
Apply these standards when evaluating clauses:
- EU: Directive 93/13/EEC on unfair terms (significant imbalance test); GDPR 2016/679; Rome I Regulation on choice of law
- US: Unconscionability doctrine (UCC § 2-302); Federal Arbitration Act; AT&T Mobility v. Concepcion (mandatory arbitration + class waivers)
- UK: Consumer Rights Act 2015 ss.62-65; Unfair Contract Terms Act 1977
- France: Code de la consommation Art. L.212-1; non-compete compensation rules (Cass. Soc. 2002)

OUTPUT FORMAT
-------------
Respond with ONLY a JSON object matching this exact structure. No markdown, no preamble, no explanation outside the JSON.

{
  "trustScore": <integer 0-100, where 100 = perfectly fair and balanced>,
  "summary": "<2-3 sentences summarising the contract type, its overall risk level, and the most important concern. Written in plain language for a non-lawyer.>",
  "jurisdiction": "<the governing law jurisdiction detected from the contract (e.g. 'English law', 'California, USA', 'French law', 'Unknown')>",
  "dimensions": [
    {
      "name": "Transparency",
      "score": <0-100>,
      "label": "<one word: Excellent | Good | Fair | Poor | Opaque>",
      "note": "<one sentence: what is transparent or opaque about this contract?>"
    },
    {
      "name": "Balance",
      "score": <0-100>,
      "label": "<one word: Balanced | Fair | Uneven | One-sided | Abusive>",
      "note": "<one sentence: how symmetric are the rights and obligations?>"
    },
    {
      "name": "Legal Compliance",
      "score": <0-100>,
      "label": "<one word: Compliant | Questionable | Risky | Non-compliant>",
      "note": "<one sentence: any clauses likely unlawful under applicable consumer, employment, or data protection law?>"
    },
    {
      "name": "Financial Risk",
      "score": <0-100>,
      "label": "<one word: Low | Moderate | High | Severe>",
      "note": "<one sentence: what is the key financial risk exposure?>"
    },
    {
      "name": "Exit Freedom",
      "score": <0-100>,
      "label": "<one word: Free | Reasonable | Restricted | Locked-in>",
      "note": "<one sentence: how difficult or costly is it to exit this contract?>"
    }
  ],
  "flags": [
    {
      "id": "<short-kebab-case-id, e.g. unilateral-modification-1>",
      "title": "<concise title, max 8 words>",
      "description": "<clear, plain-language explanation of exactly why this clause is problematic. Reference the specific legal concern (e.g. 'Under Directive 93/13/EEC, unilateral modification clauses are on the grey list of potentially unfair terms'). Max 3 sentences.>",
      "severity": "<CRITICAL | SUSPECT | MINOR>",
      "quote": "<verbatim excerpt from the contract that triggered this flag, max 120 characters. Use '...' if truncating.>"
    }
  ]
}

SEVERITY CALIBRATION
--------------------
Apply severity consistently with these legal thresholds:

CRITICAL — the clause is clearly abusive, likely unlawful, or severely disadvantages the non-drafting party:
- Mandatory arbitration + class-action waiver in a consumer contract (eliminates practical redress; problematic under EU law, and post-Concepcion in the US)
- Unilateral modification right with no meaningful opt-out or exit right (EU Directive 93/13/EEC Annex)
- GDPR lawful basis entirely absent for personal data processing
- Liability exclusion for death or personal injury (void under UK CRA 2015 s.65 and EU law)
- Unlimited liability on the user/consumer's side with no cap
- Non-compete with no compensation where jurisdiction requires it (France, Germany)
- Auto-renewal with no advance notification obligation and no right to exit

SUSPECT — the clause is unusual, one-sided, or potentially enforceable but outside market norms:
- Choice-of-law clause designed to strip the consumer of statutory protections from their home jurisdiction
- Blanket IP assignment covering personal-time inventions with no statutory carve-out
- Termination penalty disproportionate to actual loss
- Indemnification obligation broad enough to cover third-party claims outside the user's direct control
- Non-compete with no definition of "competitive activity" or applied when employer terminates without cause
- Data retained indefinitely after account closure with no stated purpose

MINOR — worth noting, common in contracts, minor inconvenience or restriction:
- Governing law of the vendor's home state in a B2B contract
- Standard limitation of liability (fees paid in last 12 months)
- 30-day notice period for termination
- Copyright in deliverables retained by vendor with licence to client
- Arbitration clause that preserves small-claims court access

GENERAL INSTRUCTIONS
--------------------
- Be thorough but precise. Only flag genuine issues, not standard boilerplate.
- Cite the specific clause language in the "quote" field so the user can locate it in the contract.
- If you detect the governing jurisdiction from the contract, apply that jurisdiction's specific legal standards.
- If no jurisdiction is detectable, apply EU/UK consumer protection standards as the most protective framework.
- Return at least 1 flag and at most 20 flags per analysis. If the contract is genuinely fair, flag only MINOR issues.
- Do not hallucinate clause quotes — only quote text that actually appears in the contract.
- trustScore should reflect the overall assessment: 70-100 = broadly fair; 50-69 = concerning; 30-49 = risky; 0-29 = abusive.
- Return ONLY valid JSON. No markdown fences, no explanation, no trailing text.
- IMPORTANT: All human-readable text fields (summary, flag titles, flag descriptions, dimension labels, dimension notes) must be written in the language specified by the LANGUAGE INSTRUCTION at the top of this prompt, if one is present. Contract quotes in the "quote" field must always be verbatim from the original document (keep the original language). JSON keys must always be in English.`;

/**
 * Builds the locale-aware system prompt.
 *
 * For English (or when locale is undefined), returns the base prompt as-is.
 * For all other locales, prepends a LANGUAGE INSTRUCTION directive so the
 * model writes all human-readable output fields in the user's language.
 *
 * Placement at the very top of the system prompt maximises the instruction's
 * attention weight in transformer-based models.
 *
 * @param locale - The active Clippy locale, or undefined for English.
 * @returns Fully assembled system prompt string.
 */
function buildSystemPrompt(locale?: Locale): string {
  if (!locale || locale === "en") return SYSTEM_PROMPT_BASE;
  const languageName = LOCALE_LANGUAGE_NAMES[locale] ?? "English";
  const instruction = [
    `LANGUAGE INSTRUCTION: All human-readable text fields in your JSON output`,
    `("summary", flag "title", flag "description", dimension "label", dimension "note")`,
    `MUST be written in ${languageName}.`,
    `JSON field names (keys) must remain in English.`,
    `The "quote" field must always contain the verbatim original text from the contract`,
    `(do not translate quoted contract text).`,
  ].join(" ");
  return `${instruction}\n\n${SYSTEM_PROMPT_BASE}`;
}

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
 * 4. Parse the JSON response with a two-layer fallback strategy:
 *    a. Strip Markdown code fences if present
 *    b. Extract the first valid JSON object if the model prefixed/suffixed text
 * 5. Clamp trustScore to [0, 100] and coerce types to handle model output drift
 * 6. Return the result with durationMs
 *
 * ERROR HANDLING
 * --------------
 * This function throws a descriptive Error on failure. The caller (Home.tsx)
 * catches per-model errors and updates that model's state to `{ status: "error" }`.
 * One model failing does not abort the other parallel requests.
 *
 * HTTP error codes mapped to user-friendly messages:
 *   401 → "Invalid API key — check your OpenRouter key"
 *   402 → "Insufficient OpenRouter credits — top up at openrouter.ai"
 *   429 → "Rate limit reached — wait a moment and try again"
 *   503 → "Model is temporarily unavailable — try a different model"
 *   Other → OpenRouter's own error message or HTTP status text
 *
 * @param contractText - Plain text content of the contract (extracted by fileParser.ts)
 * @param modelId - OpenRouter model ID (e.g. "anthropic/claude-3.5-sonnet")
 * @param apiKey - User's OpenRouter API key (decrypted at call time, never stored)
 * @param prompts - Full prompts array from AppState; only enabled ones are sent
 * @param locale - Active UI locale; directs the model to respond in that language (default: "en")
 * @returns Parsed analysis result (caller adds modelId/modelName/status)
 * @throws Error with a human-readable message if the API call or JSON parsing fails
 */
export async function analyzeWithModel(
  contractText: string,
  modelId: string,
  apiKey: string,
  prompts: AnalysisPrompt[] = [],
  locale: Locale = "en"
): Promise<Omit<ModelResult, "modelId" | "modelName" | "status">> {

  // Assemble user-selected prompt objectives into a formatted instruction block.
  // If no prompts are enabled, additionalInstructions is an empty string.
  // Pass locale so the preamble text mirrors the UI language.
  const additionalInstructions = assemblePromptInstructions(prompts, locale);

  // Build the user message. Additional objectives go first (higher model
  // attention weight), followed by the contract text.
  const userPrompt = additionalInstructions
    ? `${additionalInstructions}\n\nPlease analyze this contract:\n\n${contractText}`
    : `Please analyze this contract:\n\n${contractText}`;

  // Build the locale-aware system prompt. For non-English locales this
  // prepends a LANGUAGE INSTRUCTION directing the model to respond in the
  // user's language. See buildSystemPrompt() for details.
  const systemPrompt = buildSystemPrompt(locale);

  // Record start time for duration measurement (wall-clock, not CPU time)
  const startTime = Date.now();

  // Request body. `response_format: json_object` is requested for every model:
  // all 15 models in the v3.3.0 benchmark accepted it. If a model does reject
  // it (HTTP 400 mentioning the parameter) we retry once without it below.
  const buildBody = (jsonMode: boolean): string => JSON.stringify({
    model: modelId,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  // -------------------------------------------------------------------------
  // Network layer: timeout + one automatic retry for transient provider errors
  // -------------------------------------------------------------------------
  // The timeout covers the whole call (including a retry) so a card can never
  // stay on "Reading" longer than REQUEST_TIMEOUT_MS.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const post = (jsonMode: boolean) => fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://clippy.legal",
      "X-Title": "Clippy Contract Analyzer",
    },
    body: buildBody(jsonMode),
  });

  let response: Response;
  try {
    response = await post(true);
    // Transient upstream failure (rate limit / gateway) → wait briefly, retry once.
    if ([429, 502, 503, 504].includes(response.status)) {
      await new Promise(r => setTimeout(r, 2000));
      response = await post(true);
    }
    // A model that rejects JSON mode → retry once without it.
    if (response.status === 400) {
      const peek = await response.clone().text().catch(() => "");
      if (/response_format|json_object|json mode|structured/i.test(peek)) {
        response = await post(false);
      }
    }
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);
    if (fetchErr?.name === "AbortError") {
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds — the model may be overloaded. ` +
        `Try again or select a different model.`
      );
    }
    throw new Error(`Network error: ${fetchErr?.message || "unknown"}`);
  }
  clearTimeout(timeoutId);

  // Capture wall-clock duration immediately after the response arrives
  const durationMs = Date.now() - startTime;

  // -------------------------------------------------------------------------
  // HTTP error handling — map OpenRouter errors to actionable messages
  // -------------------------------------------------------------------------
  if (!response.ok) {
    let errMessage: string;
    try {
      const errBody = await response.json();
      // OpenRouter wraps errors in { error: { message: "..." } }
      errMessage = errBody?.error?.message || errBody?.message || response.statusText;
    } catch {
      errMessage = response.statusText || `HTTP ${response.status}`;
    }

    switch (response.status) {
      case 401:
        throw new Error(`Invalid API key — please check your OpenRouter key and try again`);
      case 402:
        throw new Error(`Insufficient OpenRouter credits — top up your account at openrouter.ai`);
      case 403:
        throw new Error(`Access denied — your API key may not have permission to use this model`);
      case 404:
        // "No endpoints found for <model>" — the model was retired or renamed.
        throw new Error(`This model is no longer available on OpenRouter — please select a different model`);
      case 429:
        throw new Error(`Rate limit reached — please wait a moment before trying again`);
      case 502:
      case 503:
        throw new Error(`Model temporarily unavailable — try a different model or retry in a moment`);
      default:
        if (/context|too long|maximum.*tokens/i.test(errMessage)) {
          throw new Error(`This contract is too long for the selected model — try a model with a larger context window (e.g. Gemini 4 Argon)`);
        }
        throw new Error(errMessage || `HTTP ${response.status}`);
    }
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  // Some providers return content as an array of parts instead of a string.
  const rawContent = choice?.message?.content;
  const content: string = Array.isArray(rawContent)
    ? rawContent.map((p: any) => (typeof p === "string" ? p : p?.text ?? "")).join("")
    : rawContent;
  if (!content) throw new Error("Empty response from model — please retry or select a different model");

  // The model ran out of output tokens: the JSON is cut off mid-way. Say so
  // plainly rather than surfacing a cryptic parser error. (Seen with
  // reasoning-heavy models that spend their budget "thinking".)
  const truncated = choice?.finish_reason === "length";

  // -------------------------------------------------------------------------
  // JSON parsing with three-layer fallback strategy
  //   1. Direct parse (the ideal case in JSON mode)
  //   2. Strip Markdown code fences (```json ... ```)
  //   3. Extract the first {...} block when the model adds a preamble
  // -------------------------------------------------------------------------
  let parsed: any;
  let parseError: Error | null = null;
  try {
    parsed = JSON.parse(content);
  } catch (e1) {
    parseError = e1 as Error;
    try {
      const stripped = content
        .replace(/^```json?\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();
      parsed = JSON.parse(stripped);
      parseError = null;
    } catch {
      try {
        const match = content.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("No JSON object found in response");
        parsed = JSON.parse(match[0]);
        parseError = null;
      } catch {
        if (truncated) {
          throw new Error(
            "The model's answer was cut off before it finished (output limit reached). " +
            "Try a different model or a shorter contract."
          );
        }
        throw new Error(
          `Model returned invalid JSON. Try a different model or a shorter contract. ` +
          `(Parser error: ${parseError?.message})`
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  // Result normalisation — never trust model output shape
  // -------------------------------------------------------------------------
  const score = Number(parsed.trustScore);
  const SEVERITIES = ["CRITICAL", "SUSPECT", "MINOR"] as const;

  const flags: ClauseFlag[] = (Array.isArray(parsed.flags) ? parsed.flags : [])
    .filter((f: any) => f && typeof f === "object")
    .slice(0, 20)
    .map((f: any, i: number): ClauseFlag => {
      const sev = String(f.severity ?? "").toUpperCase();
      return {
        id:          String(f.id ?? `flag-${i + 1}`),
        title:       String(f.title ?? "Untitled"),
        description: String(f.description ?? ""),
        // Unknown severities degrade to SUSPECT (visible, not alarming)
        severity:    (SEVERITIES as readonly string[]).includes(sev) ? (sev as ClauseFlag["severity"]) : "SUSPECT",
        quote:       f.quote == null ? undefined : String(f.quote),
      };
    });

  const dimensions: Dimension[] = (Array.isArray(parsed.dimensions) ? parsed.dimensions : [])
    .filter((d: any) => d && typeof d === "object")
    .map((d: any): Dimension => ({
      ...d,
      name:  String(d.name ?? ""),
      score: Math.max(0, Math.min(100, Number.isFinite(Number(d.score)) ? Number(d.score) : 50)),
      label: String(d.label ?? ""),
      note:  String(d.note ?? ""),
    }));

  return {
    // Clamp to [0,100]. Number.isFinite (not `|| 50`) so a genuine 0 stays 0.
    trustScore:   Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 50,
    summary:      String(parsed.summary     || "No summary provided."),
    jurisdiction: String(parsed.jurisdiction || "Unknown"),
    flags,
    dimensions,
    durationMs,
  };
}
