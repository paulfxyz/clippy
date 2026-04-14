/**
 * @file Home.tsx
 * @description Main application page for Clippy v2.0.0.
 *
 * OVERVIEW
 * --------
 * This is the primary (and only) user-facing page for the Clippy app.
 * It implements a 3-step wizard flow managed by a single `AppState` object:
 *
 *   Step 1 "setup"   — Upload contract file + enter OpenRouter API key + select models
 *   Step 2 "prompts" — Review/toggle/edit/add analysis objectives (prompt library)
 *   Step 3 "results" — Live parallel analysis + results dashboard
 *
 * STATE MANAGEMENT
 * ----------------
 * All application state lives in a single `useState<AppState>` hook using the
 * AppState type from schema.ts. The design avoids splitting state into many
 * useState calls because the wizard steps are deeply interdependent — a single
 * state object makes resets, navigation, and state inspection straightforward.
 *
 * Sub-components defined in this file (co-located for simplicity):
 *   - StepIndicator:  The 3-step progress bar at the top
 *   - SeverityBadge:  Colored severity label pill (CRITICAL/SUSPECT/MINOR)
 *   - ModelChip:      Toggleable model selection button
 *   - DimensionBar:   Score bar for each dimension (Transparency, Balance, etc.)
 *
 * V2 NEW FEATURES
 * ---------------
 * - AES-GCM API key encryption (client-side, session-scoped, via encryption.ts)
 * - Modular prompt library with per-prompt toggle/edit in Step 2
 * - Custom prompt creation (user-defined objectives)
 * - Export to PDF or Markdown (via export.ts)
 * - Share URL generation (via share.ts) — results encoded in URL hash
 * - durationMs shown per model in the results dashboard
 *
 * PRIVACY MODEL
 * -------------
 * - No file ever leaves the browser to a Clippy server
 * - API key is encrypted (AES-GCM) as soon as it is entered; the raw string
 *   is only held in state briefly before being replaced by the encrypted blob
 * - API key is decrypted just-in-time before each model API call
 * - Share payloads never include the API key — only results
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload, Key, Cpu, ChevronRight, ChevronLeft, AlertTriangle,
  X, Eye, EyeOff, Plus, Github, FileText, RefreshCw, Copy,
  Check, Download, Share2, Edit2, Trash2, Lock, Unlock,
  FileDown, Clock, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ClippyCharacter } from "@/components/ClippyCharacter";
import { TrustScoreRing } from "@/components/TrustScoreRing";
import { AVAILABLE_MODELS, analyzeWithModel } from "@/lib/openrouter";
import { extractTextFromFile } from "@/lib/fileParser";
import { encryptKey, decryptKey, maskKey } from "@/lib/encryption";
import { DEFAULT_PROMPTS, createCustomPrompt, CATEGORY_META } from "@/lib/prompts";
import { downloadAsPDF, downloadAsMarkdown } from "@/lib/export";
import { buildShareUrl } from "@/lib/share";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { AppState, AppStep, AnalysisPrompt, ModelResult, Severity, SharePayload } from "@shared/schema";

// ---------------------------------------------------------------------------
// Clippy speech bubble messages per step
// ---------------------------------------------------------------------------

/**
 * Pre-written message keys for each step — actual text is resolved via t().
 * This allows Clippy's speech bubble to update when the locale changes.
 */
const CLIPPY_MESSAGE_KEYS: Record<string, string> = {
  setup:     "clippy.setup",
  prompts:   "clippy.prompts",
  analyzing: "clippy.analyzing",
  results:   "clippy.results",
  idle:      "clippy.idle",
};

// ---------------------------------------------------------------------------
// Severity sort order
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<Severity, number> = { CRITICAL: 0, SUSPECT: 1, MINOR: 2 };

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Step progress indicator bar.
 * Shows 3 numbered steps with connecting lines; current step is highlighted.
 */
function StepIndicator({ current }: { current: AppStep }) {
  const steps: Array<{ key: AppStep; label: string }> = [
    { key: "setup",   label: "Setup" },
    { key: "prompts", label: "Objectives" },
    { key: "results", label: "Results" },
  ];

  // Map step key to a numeric index for comparison
  const idx = { setup: 0, prompts: 1, results: 2 } as Record<AppStep, number>;
  const currentIdx = idx[current] ?? 0;

  return (
    <div className="flex items-center justify-center gap-0" data-testid="step-indicator">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${i <= currentIdx
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
                }`}
              data-testid={`step-circle-${step.key}`}
            >
              {i < currentIdx ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span
              className={`text-xs ${i === currentIdx ? "text-foreground font-medium" : "text-muted-foreground"}`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-14 h-0.5 mx-1 mb-4 transition-colors ${
                i < currentIdx ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Colored severity badge pill used in the flags list.
 * Uses custom CSS classes defined in index.css for CRITICAL/SUSPECT/MINOR.
 */
function SeverityBadge({ severity }: { severity: Severity }) {
  const cls = {
    CRITICAL: "badge-critical",
    SUSPECT:  "badge-suspect",
    MINOR:    "badge-minor",
  }[severity];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {severity}
    </span>
  );
}

/**
 * Toggleable model chip shown in the model selection grid (Step 1).
 * Highlights in primary yellow when selected.
 */
function ModelChip({
  modelId, selected, onClick
}: {
  modelId: string;
  selected: boolean;
  onClick: () => void;
}) {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId)!;
  return (
    <button
      onClick={onClick}
      title={model.description}
      data-testid={`model-chip-${modelId}`}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
        selected
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ background: selected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
      >
        {model.icon}
      </span>
      <div className="text-left">
        <p className="leading-none">{model.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-tight hidden sm:block">
          {model.provider}
        </p>
      </div>
    </button>
  );
}

/**
 * Horizontal score bar for a single analysis dimension (Transparency, Balance, etc.).
 * Color transitions: green ≥70, yellow ≥45, red <45.
 */
function DimensionBar({ name, score, note }: { name: string; score: number; note: string }) {
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#eab308" : "#ef4444";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-sm font-bold" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo Modal — screenshot slideshow
// ---------------------------------------------------------------------------

const getDemoSlides = (t: (k: string) => string) => [
  {
    src:     "https://clippy.legal/img/screenshot-step1.jpg",
    label:   t("demo.step1_label"),
    caption: t("demo.step1_caption"),
  },
  {
    src:     "https://clippy.legal/img/screenshot-step2.jpg",
    label:   t("demo.step2_label"),
    caption: t("demo.step2_caption"),
  },
  {
    src:     "https://clippy.legal/img/screenshot-step3.jpg",
    label:   t("demo.step3_label"),
    caption: t("demo.step3_caption"),
  },
];

function DemoModal({ onClose, t }: { onClose: () => void; t: (k: string) => string }) {
  const [slide, setSlide] = useState(0);
  const DEMO_SLIDES = getDemoSlides(t);
  const total = DEMO_SLIDES.length;
  const prev  = () => setSlide(s => (s - 1 + total) % total);
  const next  = () => setSlide(s => (s + 1) % total);

  // Close on Escape, navigate on arrow keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">{DEMO_SLIDES[slide].label}</span>
            <div className="flex gap-1.5">
              {DEMO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === slide ? "bg-primary scale-125" : "bg-muted-foreground/40 hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Screenshot */}
        <div className="relative bg-muted/30">
          <img
            key={slide}
            src={DEMO_SLIDES[slide].src}
            alt={DEMO_SLIDES[slide].caption}
            className="w-full block"
            style={{ animation: "fadeIn 0.25s ease" }}
          />
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Caption */}
        <div className="px-5 py-3 text-sm text-muted-foreground">
          {DEMO_SLIDES[slide].caption}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * The full Clippy application — 3-step wizard.
 *
 * Steps:
 *   1. setup   → file upload + API key + model selection
 *   2. prompts → analysis objectives editor
 *   3. results → live analysis + results dashboard
 *
 * State is entirely local (no server, no localStorage — privacy-first).
 */
export default function Home() {
  // i18n context — provides t() for all UI strings and locale-aware Clippy messages
  const { t, locale } = useI18n();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [state, setState] = useState<AppState>({
    file:            null,
    fileText:        "",
    fileName:        "",
    apiKey:          "",
    apiKeyEncrypted: "",
    selectedModels:  ["anthropic/claude-3.7-sonnet", "openai/gpt-4.1"],
    prompts:         DEFAULT_PROMPTS,
    results:         [],
    step:            "setup",
  });

  // Local UI state (not part of global AppState)
  const [isDragging, setIsDragging]   = useState(false);
  const [showKey, setShowKey]         = useState(false);
  const [isKeyLocked, setIsKeyLocked] = useState(false);
  const [clippyMsgKey, setClippyMsgKey] = useState("clippy.idle");
  const [clippyTalking, setClippyTalking] = useState(false);
  const [activeModel, setActiveModel] = useState<string>("");
  const [copied, setCopied]           = useState(false);
  const [shareUrl, setShareUrl]       = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Prompt editing state (Step 2)
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editDraft, setEditDraft]             = useState({ title: "", description: "", prompt: "" });
  const [showDemo, setShowDemo]               = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // ---------------------------------------------------------------------------
  // Clippy speech bubble helper
  // ---------------------------------------------------------------------------

  /**
   * Sets Clippy's speech bubble by key and briefly plays the talking animation.
   * Accepts a translation key (e.g. "clippy.setup") — resolved at render time
   * via t(), so it auto-updates when the locale changes.
   */
  const setClippy = (key: string) => {
    setClippyTalking(true);
    setClippyMsgKey(key);
    setTimeout(() => setClippyTalking(false), 2000);
  };

  // Update Clippy's message key whenever the step changes
  useEffect(() => {
    setClippy(CLIPPY_MESSAGE_KEYS[state.step] || CLIPPY_MESSAGE_KEYS.idle);
  }, [state.step]);

  // ---------------------------------------------------------------------------
  // Step 1: File handling
  // ---------------------------------------------------------------------------

  /**
   * Handles a dropped or selected file.
   * Validates the file type, extracts text via fileParser.ts,
   * and advances to the next step.
   */
  const handleFile = useCallback(async (file: File) => {
    const isValid = /\.(pdf|docx|txt|md)$/i.test(file.name);
    if (!isValid) {
      setClippy("clippy.wrong_format");
      return;
    }
    try {
      const text = await extractTextFromFile(file);
      setState(s => ({
        ...s,
        file,
        fileText: text,
        fileName: file.name,
      }));
      setClippy("clippy.file_loaded");
    } catch (err: any) {
      const msg: string = err?.message || "";
      // Show the specific error in a toast so users know exactly what went wrong
      // (scanned PDF, password-protected, too large, etc.) while the Clippy
      // bubble shows the appropriate contextual message.
      if (msg.toLowerCase().includes("password")) {
        setClippy("clippy.file_error");
      } else if (msg.toLowerCase().includes("scanned") || msg.toLowerCase().includes("little text")) {
        setClippy("clippy.file_scanned");
      } else if (msg.toLowerCase().includes("too large")) {
        setClippy("clippy.file_too_large");
      } else {
        setClippy("clippy.file_error");
      }
      // Always show the actual technical reason in a toast
      toast({
        title: t("toast.file_read_error"),
        description: msg || t("toast.file_read_error_desc"),
        variant: "destructive",
      });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ---------------------------------------------------------------------------
  // Step 1: API key encryption
  // ---------------------------------------------------------------------------

  /**
   * Encrypts the entered API key and replaces the raw key in state.
   * After locking, only the masked display value is shown; the raw string
   * is no longer accessible from the state except for the encrypted blob.
   */
  const handleLockKey = async () => {
    if (!state.apiKey.trim()) return;
    try {
      const encrypted = await encryptKey(state.apiKey);
      setState(s => ({
        ...s,
        apiKeyEncrypted: encrypted,
        // We deliberately clear the raw key from state after encryption.
        // The raw key is only recovered at analysis time via decryptKey().
        apiKey: "",
      }));
      setIsKeyLocked(true);
      setClippy("clippy.key_locked");
    } catch {
      toast({ title: t("toast.encryption_error"), description: t("toast.encryption_error_desc"), variant: "destructive" });
    }
  };

  /** Clears the encrypted key and unlocks for re-entry. */
  const handleUnlockKey = () => {
    setState(s => ({ ...s, apiKey: "", apiKeyEncrypted: "" }));
    setIsKeyLocked(false);
  };

  // ---------------------------------------------------------------------------
  // Step 1 → Step 2 navigation
  // ---------------------------------------------------------------------------

  /** Validates Step 1 inputs and advances to Step 2 (prompts). */
  const goToPrompts = () => {
    const hasKey = isKeyLocked ? !!state.apiKeyEncrypted : !!state.apiKey.trim();
    if (!state.file) {
      setClippy("clippy.need_file");
      return;
    }
    if (!hasKey) {
      setClippy("clippy.need_key");
      return;
    }
    if (state.selectedModels.length === 0) {
      setClippy("clippy.need_model");
      return;
    }
    setState(s => ({ ...s, step: "prompts" }));
  };

  // ---------------------------------------------------------------------------
  // Step 2: Prompt management
  // ---------------------------------------------------------------------------

  /** Toggles a prompt's enabled state. */
  const togglePrompt = (id: string) => {
    setState(s => ({
      ...s,
      prompts: s.prompts.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p),
    }));
  };

  /** Starts inline editing for a prompt. */
  const startEdit = (p: AnalysisPrompt) => {
    setEditingPromptId(p.id);
    setEditDraft({ title: p.title, description: p.description, prompt: p.prompt });
  };

  /** Saves the in-progress edit back to state. */
  const saveEdit = () => {
    if (!editingPromptId) return;
    setState(s => ({
      ...s,
      prompts: s.prompts.map(p =>
        p.id === editingPromptId
          ? { ...p, title: editDraft.title, description: editDraft.description, prompt: editDraft.prompt }
          : p
      ),
    }));
    setEditingPromptId(null);
  };

  /** Cancels the current edit without saving. */
  const cancelEdit = () => {
    setEditingPromptId(null);
  };

  /** Adds a new blank custom prompt to the list. */
  const addCustomPrompt = () => {
    const newPrompt = createCustomPrompt();
    setState(s => ({ ...s, prompts: [...s.prompts, newPrompt] }));
    // Immediately open it for editing
    setEditingPromptId(newPrompt.id);
    setEditDraft({ title: "", description: "", prompt: "" });
  };

  /** Deletes a custom user-created prompt (built-in prompts cannot be deleted). */
  const deletePrompt = (id: string) => {
    setState(s => ({
      ...s,
      prompts: s.prompts.filter(p => p.id !== id),
    }));
    if (editingPromptId === id) setEditingPromptId(null);
  };

  // ---------------------------------------------------------------------------
  // Step 2 → Step 3: Run analysis
  // ---------------------------------------------------------------------------

  /**
   * Kicks off the parallel multi-model analysis.
   *
   * Flow:
   * 1. Recover the raw API key (decrypt if locked, or read from state)
   * 2. Initialise per-model result entries with status "loading"
   * 3. Advance to the results step
   * 4. Fire all model requests in parallel (Promise.allSettled)
   * 5. Update each model's result entry as they complete
   * 6. Set the first successfully completed model as the active tab
   */
  const handleAnalyze = async () => {
    // Recover API key — may be encrypted or raw depending on lock state
    let rawKey: string;
    try {
      rawKey = isKeyLocked
        ? await decryptKey(state.apiKeyEncrypted)
        : state.apiKey.trim();
    } catch {
      toast({ title: t("toast.decrypt_failed"), description: t("toast.decrypt_failed_desc"), variant: "destructive" });
      return;
    }

    if (!rawKey) {
      setClippy("clippy.key_missing");
      return;
    }

    // Check that at least one prompt is enabled
    const enabledPrompts = state.prompts.filter(p => p.enabled);
    if (enabledPrompts.length === 0) {
      setClippy("clippy.need_objective");
      return;
    }

    // Initialise result placeholders
    const initialResults: ModelResult[] = state.selectedModels.map(modelId => ({
      modelId,
      modelName: AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId,
      trustScore: 0,
      summary:    "",
      flags:      [],
      dimensions: [],
      status:     "loading",
    }));

    setState(s => ({ ...s, results: initialResults, step: "results" }));
    setActiveModel(state.selectedModels[0]);
    setIsAnalyzing(true);
    setShareUrl("");

    // Run all models in parallel — failures are isolated per model
    const promises = state.selectedModels.map(async (modelId) => {
      try {
        const result = await analyzeWithModel(
          state.fileText,
          modelId,
          rawKey,
          state.prompts,  // pass full array; openrouter.ts filters to enabled
          locale           // active UI locale — model will respond in this language
        );
        setState(s => ({
          ...s,
          results: s.results.map(r =>
            r.modelId === modelId ? { ...r, ...result, status: "done" } : r
          ),
        }));
      } catch (err: any) {
        setState(s => ({
          ...s,
          results: s.results.map(r =>
            r.modelId === modelId
              ? { ...r, status: "error", error: err.message }
              : r
          ),
        }));
      }
    });

    await Promise.allSettled(promises);
    setIsAnalyzing(false);
  };

  // ---------------------------------------------------------------------------
  // Results: Export and Share
  // ---------------------------------------------------------------------------

  /**
   * Builds an ExportContext from the current state and triggers the PDF download.
   */
  const handleExportPDF = () => {
    const ctx = {
      fileName:    state.fileName,
      analyzedAt:  new Date().toISOString(),
      promptTitles: state.prompts.filter(p => p.enabled).map(p => p.title),
      results:     state.results,
    };
    downloadAsPDF(ctx, state.fileName.replace(/\.[^.]+$/, ""));
    toast({ title: t("toast.pdf_downloaded"), description: t("toast.pdf_downloaded_desc") });
  };

  /**
   * Builds an ExportContext from the current state and triggers the Markdown download.
   */
  const handleExportMarkdown = () => {
    const ctx = {
      fileName:    state.fileName,
      analyzedAt:  new Date().toISOString(),
      promptTitles: state.prompts.filter(p => p.enabled).map(p => p.title),
      results:     state.results,
    };
    downloadAsMarkdown(ctx, state.fileName.replace(/\.[^.]+$/, ""));
    toast({ title: t("toast.md_downloaded"), description: t("toast.md_downloaded_desc") });
  };

  /**
   * Builds a share URL from the current results and copies it to the clipboard.
   * The share payload encodes all results but excludes the API key.
   */
  const handleShare = () => {
    const payload: SharePayload = {
      version:    "2.0.0",
      fileName:   state.fileName,
      analyzedAt: new Date().toISOString(),
      prompts:    state.prompts.filter(p => p.enabled).map(p => p.title),
      results:    state.results,
    };
    const url = buildShareUrl(payload);
    setShareUrl(url);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast({ title: t("toast.url_copied"), description: t("toast.url_copied_desc") });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast({ title: t("toast.url_generated"), description: t("toast.url_generated_desc") });
    });
  };

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  /** Resets to the upload step, preserving the API key and model selection. */
  const reset = () => {
    setState(s => ({
      file:            null,
      fileText:        "",
      fileName:        "",
      apiKey:          s.apiKey,
      apiKeyEncrypted: s.apiKeyEncrypted,
      selectedModels:  s.selectedModels,
      prompts:         DEFAULT_PROMPTS,
      results:         [],
      step:            "setup",
    }));
    setShareUrl("");
    setIsAnalyzing(false);
  };

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const activeResult    = state.results.find(r => r.modelId === activeModel);
  const doneCount       = state.results.filter(r => r.status === "done").length;
  const totalCount      = state.results.length;
  const allDone         = totalCount > 0 && state.results.every(r => r.status === "done" || r.status === "error");
  const enabledPrompts  = state.prompts.filter(p => p.enabled).length;

  // Group prompts by category for the Step 2 UI
  const promptsByCategory = state.prompts.reduce((acc, p) => {
    const cat = p.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, AnalysisPrompt[]>);

  const categoryOrder = ["general", "financial", "privacy", "employment", "ip", "custom"] as const;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">

      {/* ======================================================================
          HEADER — sticky, shows logo + nav actions
      ====================================================================== */}
      <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" width="26" height="26" fill="none" aria-label="Clippy logo">
              <path d="M 11 28 C 7 28 4 25 4 21 L 4 8 C 4 4 7 1 11 1 C 15 1 18 4 18 8 L 18 21 C 18 23.2 16.2 25 14 25 C 11.8 25 10 23.2 10 21 L 10 10"
                    stroke="#C8A800" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M 11 28 C 7 28 4 25 4 21 L 4 8 C 4 4 7 1 11 1 C 15 1 18 4 18 8 L 18 21 C 18 23.2 16.2 25 14 25 C 11.8 25 10 23.2 10 21 L 10 10"
                    stroke="#F5D000" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="font-bold text-base tracking-tight">clippy</span>
            <span className="hidden sm:inline text-muted-foreground text-sm select-none">·</span>
            <span className="hidden sm:inline text-xs text-muted-foreground tracking-wide">your contract analyst</span>
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">{t("nav.version_badge")}</Badge>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            {state.step !== "setup" && (
              <Button variant="ghost" size="sm" onClick={reset} data-testid="button-reset">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {t("step3.back_button")}
              </Button>
            )}
            <a
              href="https://github.com/paulfxyz/clippy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">{t("nav.github")}</span>
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Clippy mascot row */}
        <div className="flex justify-end">
          <ClippyCharacter
            message={t(clippyMsgKey)}
            isTalking={clippyTalking}
            size="md"
          />
        </div>

        {/* Step indicator (shown for setup and prompts steps) */}
        {(state.step === "setup" || state.step === "prompts") && (
          <StepIndicator current={state.step} />
        )}

        {/* ====================================================================
            STEP 1: SETUP — File + API Key + Models
        ==================================================================== */}
        {state.step === "setup" && (
          <div className="fade-in-up space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold tracking-tight">{t("step1.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("step1.subtitle")}</p>
              <button
                onClick={() => setShowDemo(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted/60 text-sm font-medium text-muted-foreground hover:text-foreground transition-all group"
              >
                <span className="w-5 h-5 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Play className="w-3 h-3 text-primary fill-primary" />
                </span>
                {t("demo.button")}
              </button>
            </div>

            {/* ---- Drop zone ---- */}
            {!state.file ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                data-testid="dropzone"
                className={`paper-texture rounded-2xl border-2 border-dashed transition-all cursor-pointer p-12 text-center
                  ${isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                  data-testid="input-file"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{t("step1.drop_title")}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t("step1.drop_subtitle")}</p>
                  </div>
                  <Button variant="outline" size="sm" className="pointer-events-none">
                    {t("step1.drop_button")}
                  </Button>
                </div>
              </div>
            ) : (
              /* ---- File loaded banner ---- */
              <Card className="border-border bg-green-50/60 dark:bg-green-950/20">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{state.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(state.fileText.length / 1000).toFixed(1)}k characters extracted
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setState(s => ({ ...s, file: null, fileText: "", fileName: "" }));
                    fileInputRef.current && (fileInputRef.current.value = "");
                  }} data-testid="button-remove-file">
                    <X className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ---- API Key ---- */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  {t("step1.api_key_label")}
                  {isKeyLocked && (
                    <Badge variant="secondary" className="ml-auto text-xs flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Encrypted
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isKeyLocked ? (
                  /* Locked state — show masked placeholder + unlock button */
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/40 font-mono text-sm text-muted-foreground">
                      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                      sk-or-v1-••••••••••••••••••••••••
                    </div>
                    <Button variant="outline" size="sm" onClick={handleUnlockKey} data-testid="button-unlock-key">
                      <Unlock className="w-3.5 h-3.5 mr-1.5" /> {t("step1.unlock_button")}
                    </Button>
                  </div>
                ) : (
                  /* Unlocked state — raw input with show/hide toggle */
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKey ? "text" : "password"}
                        placeholder="sk-or-v1-..."
                        value={state.apiKey}
                        onChange={e => setState(s => ({ ...s, apiKey: e.target.value }))}
                        className="pr-10 font-mono text-sm"
                        data-testid="input-api-key"
                        onKeyDown={e => e.key === "Enter" && handleLockKey()}
                        autoComplete="off"
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        data-testid="button-toggle-key-visibility"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLockKey}
                      disabled={!state.apiKey.trim()}
                      data-testid="button-lock-key"
                    >
                      <Lock className="w-3.5 h-3.5 mr-1.5" /> {t("step1.lock_button")}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("step1.api_key_hint")}{" "}
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    openrouter.ai/keys
                  </a>
                  . {t("step1.api_key_privacy")}
                </p>
              </CardContent>
            </Card>

            {/* ---- Model selection ---- */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  {t("step1.models_label")}
                  <Badge variant="secondary" className="ml-auto">
                    {state.selectedModels.length} selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_MODELS.map(model => (
                    <ModelChip
                      key={model.id}
                      modelId={model.id}
                      selected={state.selectedModels.includes(model.id)}
                      onClick={() => {
                        setState(s => ({
                          ...s,
                          selectedModels: s.selectedModels.includes(model.id)
                            ? s.selectedModels.filter(id => id !== model.id)
                            : [...s.selectedModels, model.id],
                        }));
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {t("step1.models_hint")}
                </p>
              </CardContent>
            </Card>

            {/* ---- Feature cards ---- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: "🔍", title: t("step1.feature_multimodel"), desc: t("step1.feature_multimodel_desc") },
                { icon: "🔒", title: t("step1.feature_private"), desc: t("step1.feature_private_desc") },
                { icon: "⚡", title: t("step1.feature_dimensions"), desc: t("step1.feature_dimensions_desc") },
              ].map(f => (
                <Card key={f.title} className="border-border">
                  <CardContent className="pt-4 pb-4 space-y-1">
                    <span className="text-xl">{f.icon}</span>
                    <p className="font-semibold text-xs">{f.title}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ---- Continue button ---- */}
            <Button
              className="w-full"
              size="lg"
              onClick={goToPrompts}
              disabled={!state.file || (!state.apiKey.trim() && !isKeyLocked) || state.selectedModels.length === 0}
              data-testid="button-next-step"
            >
              {t("step1.next_button")} <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ====================================================================
            STEP 2: PROMPTS — Analysis objectives editor
        ==================================================================== */}
        {state.step === "prompts" && (
          <div className="fade-in-up space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">{t("step2.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("step2.subtitle")}</p>
            </div>

            {/* Objectives list grouped by category */}
            <div className="space-y-5">
              {categoryOrder.map(cat => {
                const prompts = promptsByCategory[cat];
                if (!prompts || prompts.length === 0) return null;
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {prompts.map(prompt => (
                        <Card
                          key={prompt.id}
                          className={`border transition-colors ${
                            prompt.enabled ? "border-primary/30 bg-primary/5" : "border-border"
                          }`}
                          data-testid={`prompt-card-${prompt.id}`}
                        >
                          {editingPromptId === prompt.id ? (
                            /* ---- Edit mode ---- */
                            <CardContent className="pt-4 pb-4 space-y-3">
                              <Input
                                placeholder={t("step2.prompt_title_placeholder")}
                                value={editDraft.title}
                                onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))}
                                className="font-medium text-sm"
                                data-testid={`input-prompt-title-${prompt.id}`}
                              />
                              <Input
                                placeholder={t("step2.prompt_desc_placeholder")}
                                value={editDraft.description}
                                onChange={e => setEditDraft(d => ({ ...d, description: e.target.value }))}
                                className="text-sm"
                                data-testid={`input-prompt-description-${prompt.id}`}
                              />
                              <Textarea
                                placeholder={t("step2.prompt_body_placeholder")}
                                value={editDraft.prompt}
                                onChange={e => setEditDraft(d => ({ ...d, prompt: e.target.value }))}
                                className="text-sm resize-none font-mono"
                                rows={5}
                                data-testid={`textarea-prompt-body-${prompt.id}`}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={saveEdit} data-testid={`button-save-prompt-${prompt.id}`}>
                                  <Check className="w-3.5 h-3.5 mr-1" /> {t("step2.save_button")}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEdit}>{t("step2.cancel_button")}</Button>
                              </div>
                            </CardContent>
                          ) : (
                            /* ---- View mode ---- */
                            <CardContent className="pt-4 pb-4">
                              <div className="flex items-start gap-3">
                                <Switch
                                  checked={prompt.enabled}
                                  onCheckedChange={() => togglePrompt(prompt.id)}
                                  data-testid={`switch-prompt-${prompt.id}`}
                                  className="mt-0.5 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm">{prompt.title}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                                    {prompt.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => startEdit(prompt)}
                                    data-testid={`button-edit-prompt-${prompt.id}`}
                                    title={t("step2.edit_tooltip")}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  {prompt.isCustom && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => deletePrompt(prompt.id)}
                                      data-testid={`button-delete-prompt-${prompt.id}`}
                                      title={t("step2.delete_tooltip")}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add custom objective button */}
            <button
              onClick={addCustomPrompt}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-add-custom-prompt"
            >
              <Plus className="w-4 h-4" />
              {t("step2.add_custom")}
            </button>

            {/* Summary bar */}
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {enabledPrompts !== 1 ? t("step2.enabled_count_plural", { count: enabledPrompts }) : t("step2.enabled_count", { count: enabledPrompts })}
                &nbsp;·&nbsp;
                <span className="font-semibold text-foreground">{state.selectedModels.length}</span> model{state.selectedModels.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-muted-foreground">{state.fileName}</span>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setState(s => ({ ...s, step: "setup" }))}
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4 mr-1.5" /> {t("step2.back_button")}
              </Button>
              <Button
                className="flex-1"
                onClick={handleAnalyze}
                disabled={enabledPrompts === 0}
                data-testid="button-run-analysis"
              >
                {t("step2.run_button")} <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ====================================================================
            STEP 3: RESULTS — Live analysis + dashboard
        ==================================================================== */}
        {state.step === "results" && (
          <div className="fade-in-up space-y-6">

            {/* ---- Progress header (shown while analyzing) ---- */}
            {isAnalyzing && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold">{t("step3.analyzing")}</h2>
                  <p className="text-sm text-muted-foreground">
                    Running {totalCount} model{totalCount !== 1 ? "s" : ""} in parallel
                  </p>
                </div>
                <Progress value={totalCount > 0 ? (doneCount / totalCount) * 100 : 0} className="h-2" />
                <div className="space-y-2">
                  {state.results.map(r => (
                    <Card key={r.modelId} className="border-border">
                      <CardContent className="pt-3 pb-3 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          r.status === "done"    ? "bg-green-500" :
                          r.status === "error"   ? "bg-red-500" :
                          "bg-yellow-400 animate-pulse"
                        }`} />
                        <span className="text-sm font-medium flex-1">{r.modelName}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.status === "done"  ? "✓ Done" :
                           r.status === "error" ? "✗ Error" :
                           t("step3.reading")}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ---- Results dashboard (shown when at least one model is done) ---- */}
            {state.results.some(r => r.status === "done" || r.status === "error") && (
              <>
                {/* Results header bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{t("step3.title")}</h2>
                    <p className="text-xs text-muted-foreground">{state.fileName}</p>
                  </div>

                  {/* Export + Share actions (shown when all done) */}
                  {allDone && (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* PDF */}
                      <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
                        <FileDown className="w-3.5 h-3.5 mr-1.5" /> {t("step3.download_pdf")}
                      </Button>
                      {/* Markdown */}
                      <Button variant="outline" size="sm" onClick={handleExportMarkdown} data-testid="button-export-md">
                        <FileDown className="w-3.5 h-3.5 mr-1.5" /> {t("step3.download_md")}
                      </Button>
                      {/* Share */}
                      <Button variant="outline" size="sm" onClick={handleShare} data-testid="button-share">
                        {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5 mr-1.5" />}
                        {copied ? t("step3.copied") : t("step3.share_url")}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Share URL display (shown after generating) */}
                {shareUrl && (
                  <div className="fade-in-up flex items-center gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
                    <Share2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 text-xs font-mono bg-transparent outline-none text-foreground min-w-0"
                      onClick={e => (e.target as HTMLInputElement).select()}
                      data-testid="input-share-url"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      data-testid="button-copy-share-url"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                )}

                {/* Model tabs */}
                <Tabs value={activeModel} onValueChange={setActiveModel}>
                  <TabsList className="flex-wrap h-auto gap-1 p-1">
                    {state.results.map(r => (
                      <TabsTrigger
                        key={r.modelId}
                        value={r.modelId}
                        data-testid={`tab-model-${r.modelId}`}
                        className="text-xs py-1.5"
                      >
                        {r.status === "loading" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse mr-1.5" />
                        )}
                        {r.status === "done" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                        )}
                        {r.status === "error" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                        )}
                        {r.modelName}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {state.results.map(result => (
                    <TabsContent key={result.modelId} value={result.modelId} className="space-y-6 mt-4">

                      {/* Error state */}
                      {result.status === "error" && (
                        <Card className="border-destructive bg-destructive/5">
                          <CardContent className="pt-5 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-sm">{t("step3.analysis_failed")}</p>
                              <p className="text-xs text-muted-foreground">{result.error}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Loading skeleton */}
                      {result.status === "loading" && (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 rounded-xl shimmer" />
                          ))}
                        </div>
                      )}

                      {/* Done state — full results dashboard */}
                      {result.status === "done" && (
                        <>
                          {/* Top row: Trust score + Summary */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="border-border flex items-center justify-center py-6">
                              <div className="text-center space-y-3">
                                <TrustScoreRing score={result.trustScore} size={120} />
                                <div>
                                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                    {t("step3.trust_score")}
                                  </p>
                                  {result.jurisdiction && result.jurisdiction !== "Unknown" && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      📍 {result.jurisdiction}
                                    </p>
                                  )}
                                  {result.durationMs && (
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {(result.durationMs / 1000).toFixed(1)}s
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Card>

                            <Card className="border-border sm:col-span-2">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm">{t("step3.summary")}</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <p className="text-sm leading-relaxed">{result.summary}</p>
                                <div className="flex gap-4 pt-1">
                                  {[
                                    { label: t("step3.critical"), count: result.flags.filter(f => f.severity === "CRITICAL").length, color: "text-red-500" },
                                    { label: t("step3.suspect"),  count: result.flags.filter(f => f.severity === "SUSPECT").length,  color: "text-orange-500" },
                                    { label: t("step3.minor"),    count: result.flags.filter(f => f.severity === "MINOR").length,    color: "text-yellow-600" },
                                  ].map(s => (
                                    <div key={s.label} className="text-center">
                                      <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
                                      <p className="text-xs text-muted-foreground">{s.label}</p>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Dimensions */}
                          {result.dimensions.length > 0 && (
                            <Card className="border-border">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">{t("step3.dimensions")}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {result.dimensions.map(d => (
                                    <DimensionBar key={d.name} {...d} />
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Flagged clauses */}
                          {result.flags.length === 0 ? (
                            <Card className="border-border bg-green-50/60 dark:bg-green-950/20">
                              <CardContent className="pt-5 flex items-center gap-3">
                                <span className="text-2xl">✅</span>
                                <p className="text-sm font-medium">
                                  {t("step3.no_issues")}
                                </p>
                              </CardContent>
                            </Card>
                          ) : (
                            <Card className="border-border">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  {t("step3.flagged_clauses")}
                                  <Badge variant="secondary">{t("step3.issues", { count: result.flags.length })}</Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {[...result.flags]
                                  .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
                                  .map((flag, idx) => (
                                    <div
                                      key={flag.id || idx}
                                      className="rounded-lg border border-border p-4 space-y-2 hover:bg-muted/30 transition-colors"
                                      data-testid={`flag-item-${flag.id || idx}`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-sm">{flag.title}</p>
                                        <SeverityBadge severity={flag.severity} />
                                      </div>
                                      <p className="text-sm text-muted-foreground">{flag.description}</p>
                                      {flag.quote && (
                                        <blockquote className="text-xs italic text-muted-foreground border-l-2 border-primary/40 pl-3 mt-1">
                                          "{flag.quote}"
                                        </blockquote>
                                      )}
                                    </div>
                                  ))}
                              </CardContent>
                            </Card>
                          )}
                        </>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>

                {/* Analyze another button */}
                <Button
                  variant="outline"
                  onClick={reset}
                  className="w-full sm:w-auto"
                  data-testid="button-analyze-another"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> {t("step3.back_button")}
                </Button>
              </>
            )}
          </div>
        )}
      </main>

      {/* ======================================================================
          FOOTER
      ====================================================================== */}
      <footer className="mt-16 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
              <path
                d="M 8 22 C 5 22 3 20 3 17 L 3 6 C 3 3 5 1 8 1 C 11 1 13 3 13 6 L 13 17 C 13 19 11.5 20.5 9.5 20.5 C 7.5 20.5 6 19 6 17 L 6 8"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span>clippy v3.2.2 — {t("footer.tagline")}</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/paulfxyz/clippy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
            <a
              href="https://openrouter.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              {t("footer.powered_by")}
            </a>
          </div>
        </div>
      </footer>

      {/* Demo modal */}
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} t={t} />}
    </div>
  );
}
