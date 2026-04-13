/**
 * @file prompts.ts
 * @description Curated library of analysis objectives for Clippy v2.0.0.
 *
 * OVERVIEW
 * --------
 * In v1.0.0, there was a single combined system prompt. In v2.0.0, analysis
 * objectives are modular: each objective is a named, categorised prompt that
 * the user can toggle on/off, edit, or extend with their own custom prompts.
 *
 * All enabled prompts are assembled into a single instruction block that is
 * prepended to the contract text before sending to the model. This lets users
 * focus the AI on what matters to them (e.g. "only check GDPR" for a SaaS
 * agreement, or "focus on IP ownership" for an employment contract).
 *
 * PROMPT DESIGN PRINCIPLES
 * ------------------------
 * 1. Each prompt is specific and actionable — it tells the model exactly what
 *    to look for, not just "analyse this area".
 * 2. Prompts are additive — they stack without contradicting each other.
 * 3. Default prompts cover the 80% case (general contract risks). Specialised
 *    prompts (GDPR, IP, employment) are opt-in.
 * 4. Custom prompts are free-form — users write them in plain English.
 *
 * PROMPT ORDERING
 * ---------------
 * The system prompt assembles prompts in this order:
 *   1. Core instruction (always present — defines JSON output format)
 *   2. Enabled library prompts (in display order)
 *   3. Custom user prompts (at the end, highest priority)
 *
 * CATEGORIES
 * ----------
 * - general:    Applies to any contract type. Enabled by default.
 * - financial:  Financial risk, pricing, payment terms.
 * - privacy:    GDPR, data collection, third-party sharing.
 * - employment: Non-compete, IP assignment, termination clauses.
 * - ip:         Intellectual property, licensing, ownership.
 * - custom:     Created by the user at runtime.
 */

import type { AnalysisPrompt } from "@shared/schema";

// ---------------------------------------------------------------------------
// Default prompt library
// ---------------------------------------------------------------------------

/**
 * The built-in prompt library.
 * These are shown in Step 2 (Prompts) of the analysis wizard.
 * Users can toggle, edit, and add to these.
 */
export const DEFAULT_PROMPTS: AnalysisPrompt[] = [
  // ---- GENERAL (default on) ------------------------------------------------

  {
    id: "general-red-flags",
    title: "Unfair & Abusive Clauses",
    description: "Detect one-sided, abusive, or legally questionable clauses that heavily favour the drafting party.",
    category: "general",
    enabled: true,
    isDefault: true,
    isCustom: false,
    prompt: `Identify clauses that are heavily one-sided, abusive, or potentially illegal. Pay special attention to:
- Unilateral modification rights (the company can change terms at any time without notice)
- Unreasonable limitations of liability that expose only one party
- Mandatory arbitration that eliminates the right to sue in court
- Automatic renewal with very short cancellation windows
- Unlimited damage or indemnification obligations on the user's side`,
  },

  {
    id: "general-termination",
    title: "Termination & Exit Rights",
    description: "Analyse how easy it is to exit the contract and what obligations survive termination.",
    category: "general",
    enabled: true,
    isDefault: true,
    isCustom: false,
    prompt: `Examine all termination, cancellation, and exit clauses:
- How many days notice is required to terminate?
- Can either party terminate for convenience, or only for cause?
- Are there financial penalties for early termination?
- What obligations (non-compete, data retention, payment) survive after termination?
- Is there an auto-renewal clause and is the opt-out window fair?`,
  },

  {
    id: "general-governing-law",
    title: "Governing Law & Jurisdiction",
    description: "Check where disputes must be resolved and whether this is fair for both parties.",
    category: "general",
    enabled: true,
    isDefault: true,
    isCustom: false,
    prompt: `Analyse the governing law and dispute resolution clauses:
- Which country/state law governs the contract?
- Where must disputes be filed (courts or arbitration)?
- Is mandatory arbitration in a distant or inconvenient jurisdiction?
- Are class-action lawsuits waived?
- Does the jurisdiction clause heavily favour one party?`,
  },

  // ---- FINANCIAL (default off) ---------------------------------------------

  {
    id: "financial-pricing",
    title: "Pricing & Payment Risks",
    description: "Find hidden fees, automatic price increases, and unfair payment terms.",
    category: "financial",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Scrutinise all financial clauses:
- Are there automatic price increase clauses (e.g. "prices may increase by up to X% annually")?
- Are there hidden fees, overage charges, or setup costs not obvious from the main price?
- What are the late payment penalties — are they proportionate?
- Who bears the cost of currency conversion, taxes, or transaction fees?
- Is payment non-refundable once made? Under what conditions?`,
  },

  {
    id: "financial-liability",
    title: "Liability & Indemnification",
    description: "Assess exposure to financial liability and indemnification obligations.",
    category: "financial",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Analyse all liability, indemnification, and warranty disclaimers:
- Is total liability capped, and if so, at what amount?
- Are there carve-outs to the liability cap that expose you to unlimited liability?
- Who must indemnify whom, and for what events?
- Does the indemnification clause cover third-party claims?
- Are warranties disclaimed in a way that leaves you with no recourse if the service fails?`,
  },

  // ---- PRIVACY (default off) -----------------------------------------------

  {
    id: "privacy-gdpr",
    title: "Data Privacy & GDPR",
    description: "Check data collection, processing, third-party sharing, and GDPR compliance.",
    category: "privacy",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Analyse all data privacy and personal data clauses under GDPR and general best practices:
- What personal data is collected, and for what stated purpose?
- Is data shared with third parties? Which ones, and for what purpose?
- Does the contract allow selling or monetising your data?
- What are your rights to access, correct, or delete your data?
- How long is data retained after the relationship ends?
- Is there a legitimate legal basis stated for each data processing activity?`,
  },

  {
    id: "privacy-monitoring",
    title: "Monitoring & Surveillance",
    description: "Identify clauses permitting monitoring of communications, devices, or activity.",
    category: "privacy",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Look for any clauses permitting surveillance, monitoring, or tracking:
- Does the contract allow monitoring of emails, communications, or device activity?
- Can the other party access your systems, accounts, or files?
- Are there background check or screening obligations?
- Is location tracking or biometric data collection permitted?
- Are there audit rights that allow the other party to inspect your systems?`,
  },

  // ---- EMPLOYMENT (default off) --------------------------------------------

  {
    id: "employment-noncompete",
    title: "Non-Compete & Restrictive Covenants",
    description: "Flag non-compete, non-solicitation, and garden-leave clauses.",
    category: "employment",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Examine all post-employment and competitive restriction clauses:
- How long and how geographically broad is any non-compete?
- Does the non-compete apply regardless of who terminates the contract?
- Are there non-solicitation clauses for clients or employees?
- Is there a garden leave provision and is it compensated?
- Are these restrictions likely enforceable in the stated jurisdiction?`,
  },

  {
    id: "employment-ip-assignment",
    title: "IP Assignment (Employment)",
    description: "Check who owns work created during or outside employment.",
    category: "employment",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Analyse all intellectual property assignment and ownership clauses in the employment context:
- Does the employer claim ownership of work created outside working hours or on personal equipment?
- Is there a blanket IP assignment that covers pre-existing or unrelated inventions?
- Are moral rights waived?
- Does the contract require disclosure of all inventions, even personal ones?
- What happens to IP rights after termination?`,
  },

  // ---- IP (default off) ----------------------------------------------------

  {
    id: "ip-licensing",
    title: "IP & Licensing Rights",
    description: "Check licensing breadth, ownership, and restrictions on use of your content.",
    category: "ip",
    enabled: false,
    isDefault: false,
    isCustom: false,
    prompt: `Analyse all intellectual property licensing and ownership clauses:
- Does the contract grant an overly broad licence to your content or data?
- Is any licence granted royalty-free, irrevocable, or sublicensable in ways that could be exploited?
- Who owns work created collaboratively or on behalf of the other party?
- Are there restrictions on your ability to use competing products or publish findings?
- Does the contract include a grant-back clause that gives the other party rights to your improvements?`,
  },
];

// ---------------------------------------------------------------------------
// Prompt assembly
// ---------------------------------------------------------------------------

/**
 * Assembles the enabled prompts into a single instruction string.
 *
 * The resulting string is injected into the OpenRouter request as additional
 * user instructions, after the core system prompt and before the contract text.
 *
 * @param prompts - All prompts in the current session state.
 * @returns A formatted instruction string, or empty string if nothing is enabled.
 */
export function assemblePromptInstructions(prompts: AnalysisPrompt[]): string {
  const enabled = prompts.filter(p => p.enabled);
  if (enabled.length === 0) return "";

  const sections = enabled.map(p =>
    `### ${p.title}\n${p.prompt}`
  );

  return `In addition to the general analysis, pay special attention to the following specific objectives:\n\n${sections.join("\n\n")}`;
}

// ---------------------------------------------------------------------------
// Prompt utilities
// ---------------------------------------------------------------------------

/**
 * Creates a new blank custom prompt with a generated ID.
 * Used when the user clicks "Add Custom Objective" in Step 2.
 *
 * @returns A new AnalysisPrompt in the "custom" category, ready for editing.
 */
export function createCustomPrompt(): AnalysisPrompt {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    description: "",
    prompt: "",
    category: "custom",
    enabled: true,
    isDefault: false,
    isCustom: true,
  };
}

/**
 * Maps a prompt category to a display label and colour class.
 */
export const CATEGORY_META: Record<AnalysisPrompt["category"], { label: string; color: string }> = {
  general:    { label: "General",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  financial:  { label: "Financial",  color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  privacy:    { label: "Privacy",    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  employment: { label: "Employment", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  ip:         { label: "IP",         color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  custom:     { label: "Custom",     color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
};
