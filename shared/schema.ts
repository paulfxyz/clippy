/**
 * @file schema.ts — Clippy v2.0.0 shared types
 *
 * v2 introduces:
 *   - AnalysisPrompt: named, editable analysis objectives
 *   - AppState: 3-step state machine (setup → prompts → results)
 *   - SharePayload: the compressed blob stored in the URL hash for sharing
 */

// ---------------------------------------------------------------------------
// Severity
// ---------------------------------------------------------------------------

export type Severity = "CRITICAL" | "SUSPECT" | "MINOR";

// ---------------------------------------------------------------------------
// Clause flag
// ---------------------------------------------------------------------------

export interface ClauseFlag {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  quote?: string;
}

// ---------------------------------------------------------------------------
// Dimension
// ---------------------------------------------------------------------------

export interface Dimension {
  name: string;
  score: number;
  label: string;
  note: string;
}

// ---------------------------------------------------------------------------
// Analysis prompt (v2 new)
// ---------------------------------------------------------------------------

/**
 * A named analysis objective. Users see a curated library of prompts
 * and can toggle, edit, or add their own. All enabled prompts are
 * concatenated into the system instruction before the contract text.
 *
 * category: groups prompts visually in the UI
 * isDefault: pre-enabled for every new analysis
 * isCustom: created by the user (can be deleted)
 */
export interface AnalysisPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;          // the actual instruction text sent to the model
  category: "general" | "privacy" | "financial" | "employment" | "ip" | "custom";
  enabled: boolean;
  isDefault: boolean;
  isCustom: boolean;
}

// ---------------------------------------------------------------------------
// Per-model result
// ---------------------------------------------------------------------------

export interface ModelResult {
  modelId: string;
  modelName: string;
  trustScore: number;
  summary: string;
  flags: ClauseFlag[];
  dimensions: Dimension[];
  jurisdiction?: string;
  status: "pending" | "loading" | "done" | "error";
  error?: string;
  durationMs?: number;     // v2: how long the analysis took
}

// ---------------------------------------------------------------------------
// App state machine (v2: 3 steps)
// ---------------------------------------------------------------------------

/**
 * Step 1 "setup"   — upload file + enter API key + select models
 * Step 2 "prompts" — review/edit/add analysis objectives
 * Step 3 "results" — live analysis + results dashboard
 */
export type AppStep = "setup" | "prompts" | "results";

export interface AppState {
  // File
  file: File | null;
  fileText: string;
  fileName: string;

  // Auth — held in memory only, never persisted
  apiKey: string;           // raw key, never stored to disk/localStorage
  apiKeyEncrypted: string;  // AES-GCM encrypted blob (session only, for UI "lock" indicator)

  // Models
  selectedModels: string[];

  // Prompts (v2)
  prompts: AnalysisPrompt[];

  // Results
  results: ModelResult[];

  // Navigation
  step: AppStep;

  // Share
  shareId?: string;         // set after generating a share URL
}

// ---------------------------------------------------------------------------
// Share payload (v2)
// ---------------------------------------------------------------------------

/**
 * Serialised into a base64-compressed URL fragment for sharing.
 * Does NOT include the API key — only the analysis results.
 */
export interface SharePayload {
  version: "2.0.0";
  fileName: string;
  analyzedAt: string;       // ISO timestamp
  prompts: string[];        // enabled prompt titles
  results: ModelResult[];
}
