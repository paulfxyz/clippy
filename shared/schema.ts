// No server-side persistence needed — everything runs client-side
// Schema is minimal, just for type exports

export type Severity = "CRITICAL" | "SUSPECT" | "MINOR";

export interface ClauseFlag {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  quote?: string;
}

export interface Dimension {
  name: string;
  score: number; // 0-100
  label: string;
  note: string;
}

export interface ModelResult {
  modelId: string;
  modelName: string;
  trustScore: number; // 0-100
  summary: string;
  flags: ClauseFlag[];
  dimensions: Dimension[];
  jurisdiction?: string;
  status: "pending" | "loading" | "done" | "error";
  error?: string;
}

export interface AnalysisState {
  file: File | null;
  fileText: string;
  apiKey: string;
  selectedModels: string[];
  results: ModelResult[];
  step: "upload" | "config" | "analyzing" | "results";
}
