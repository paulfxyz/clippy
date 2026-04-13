import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Key, Cpu, ChevronRight, ChevronLeft, AlertTriangle, X, Eye, EyeOff, Plus, Github, FileText, Trash2, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ClippyCharacter } from "@/components/ClippyCharacter";
import { TrustScoreRing } from "@/components/TrustScoreRing";
import { AVAILABLE_MODELS, analyzeWithModel } from "@/lib/openrouter";
import { extractTextFromFile } from "@/lib/fileParser";
import type { AnalysisState, ModelResult, Severity } from "@shared/schema";

const CLIPPY_MESSAGES = {
  upload: "It looks like you're signing a contract. Would you like help checking for nasty clauses?",
  config: "Great choice! Now enter your OpenRouter API key and pick which AI models you want to interrogate this contract.",
  analyzing: "I'm reading every single clause so you don't have to. Give me a moment...",
  results: "Here's what I found! Red flags are sorted by severity. Click any model tab to compare results.",
  idle: "Drop your contract here and I'll tell you if you're about to get ripped off.",
};

const SEVERITY_ORDER: Record<Severity, number> = { CRITICAL: 0, SUSPECT: 1, MINOR: 2 };

function SeverityBadge({ severity }: { severity: Severity }) {
  const cls = {
    CRITICAL: "badge-critical",
    SUSPECT: "badge-suspect",
    MINOR: "badge-minor",
  }[severity];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {severity}
    </span>
  );
}

function ModelChip({ modelId, selected, onClick }: { modelId: string; selected: boolean; onClick: () => void }) {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId)!;
  return (
    <button
      onClick={onClick}
      data-testid={`model-chip-${modelId}`}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
        selected
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ background: selected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
      >
        {model.icon}
      </span>
      <span>{model.name}</span>
    </button>
  );
}

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

export default function Home() {
  const [state, setState] = useState<AnalysisState>({
    file: null,
    fileText: "",
    apiKey: "",
    selectedModels: ["anthropic/claude-3.5-sonnet", "openai/gpt-4o"],
    results: [],
    step: "upload",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [activeModel, setActiveModel] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [clippyMsg, setClippyMsg] = useState(CLIPPY_MESSAGES.idle);
  const [clippyTalking, setClippyTalking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setClippy = (msg: string) => {
    setClippyTalking(true);
    setClippyMsg(msg);
    setTimeout(() => setClippyTalking(false), 2000);
  };

  useEffect(() => {
    setClippy(CLIPPY_MESSAGES[state.step as keyof typeof CLIPPY_MESSAGES] || CLIPPY_MESSAGES.idle);
  }, [state.step]);

  const handleFile = useCallback(async (file: File) => {
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/markdown"].includes(file.type) && !file.name.match(/\.(pdf|docx|txt|md)$/i)) {
      setClippy("Hmm, I can only read PDF, DOCX, TXT, or MD files. Try one of those!");
      return;
    }
    try {
      const text = await extractTextFromFile(file);
      setState(s => ({ ...s, file, fileText: text, step: "config" }));
    } catch (e) {
      setClippy("Oops, I had trouble reading that file. Make sure it's not password-protected!");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!state.apiKey.trim()) {
      setClippy("Psst — I need your OpenRouter API key to work my magic!");
      return;
    }
    if (state.selectedModels.length === 0) {
      setClippy("Pick at least one model! I can't analyze with nothing.");
      return;
    }

    const initialResults: ModelResult[] = state.selectedModels.map(modelId => ({
      modelId,
      modelName: AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId,
      trustScore: 0,
      summary: "",
      flags: [],
      dimensions: [],
      status: "loading",
    }));

    setState(s => ({ ...s, results: initialResults, step: "analyzing" }));
    setActiveModel(state.selectedModels[0]);

    // Run all models in parallel
    const promises = state.selectedModels.map(async (modelId) => {
      try {
        const result = await analyzeWithModel(
          state.fileText,
          modelId,
          state.apiKey,
          customPrompt || undefined
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
            r.modelId === modelId ? { ...r, status: "error", error: err.message } : r
          ),
        }));
      }
    });

    await Promise.allSettled(promises);
    setState(s => ({ ...s, step: "results" }));
  };

  const reset = () => {
    setState({
      file: null, fileText: "", apiKey: state.apiKey,
      selectedModels: state.selectedModels, results: [], step: "upload",
    });
  };

  const activeResult = state.results.find(r => r.modelId === activeModel);

  const allDone = state.results.length > 0 && state.results.every(r => r.status === "done" || r.status === "error");
  const doneCount = state.results.filter(r => r.status === "done").length;
  const totalCount = state.results.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-label="Clippy logo">
              <path d="M 11 28 C 7 28 4 25 4 21 L 4 8 C 4 4 7 1 11 1 C 15 1 18 4 18 8 L 18 21 C 18 23.2 16.2 25 14 25 C 11.8 25 10 23.2 10 21 L 10 10" stroke="#C8A800" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M 11 28 C 7 28 4 25 4 21 L 4 8 C 4 4 7 1 11 1 C 15 1 18 4 18 8 L 18 21 C 18 23.2 16.2 25 14 25 C 11.8 25 10 23.2 10 21 L 10 10" stroke="#F5D000" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="font-bold text-lg tracking-tight">clippy</span>
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">open source</Badge>
          </div>

          <div className="flex items-center gap-2">
            {state.step !== "upload" && (
              <Button variant="ghost" size="sm" onClick={reset} data-testid="button-reset">
                <RefreshCw className="w-4 h-4 mr-1.5" /> New Analysis
              </Button>
            )}
            <a
              href="https://github.com/paulfleury/clippy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Clippy assistant row */}
        <div className="flex justify-end">
          <ClippyCharacter
            message={clippyMsg}
            isTalking={clippyTalking}
            size="md"
          />
        </div>

        {/* Step 1: Upload */}
        {state.step === "upload" && (
          <div className="fade-in-up space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Contract Analysis</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Upload any contract and let multiple AI models hunt down the clauses designed to screw you over.
                Everything runs in your browser — no file ever touches our servers.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              data-testid="dropzone"
              className={`paper-texture rounded-2xl border-2 border-dashed transition-all cursor-pointer p-16 text-center
                ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
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
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Drop your contract here</p>
                  <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, TXT, MD — up to 50MB</p>
                </div>
                <Button variant="outline" size="sm" className="pointer-events-none">
                  Or click to browse
                </Button>
              </div>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: "🔍", title: "Multi-model analysis", desc: "Run 8+ AI models simultaneously and compare their findings side by side." },
                { icon: "🔒", title: "100% private", desc: "Your contract is sent directly to OpenRouter. No storage, no logs, no server." },
                { icon: "⚡", title: "5 dimensions", desc: "Transparency, Balance, Legal Compliance, Financial Risk, and Exit Freedom." },
              ].map(f => (
                <Card key={f.title} className="border-border">
                  <CardContent className="pt-5 space-y-2">
                    <span className="text-2xl">{f.icon}</span>
                    <p className="font-semibold text-sm">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Config */}
        {state.step === "config" && (
          <div className="fade-in-up space-y-6 max-w-2xl mx-auto">
            {/* File loaded banner */}
            <Card className="border-border bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{state.file?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(state.fileText.length / 1000).toFixed(1)}k characters extracted
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={reset} data-testid="button-remove-file">
                  <X className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* API Key */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  OpenRouter API Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder="sk-or-v1-..."
                    value={state.apiKey}
                    onChange={e => setState(s => ({ ...s, apiKey: e.target.value }))}
                    className="pr-10 font-mono"
                    data-testid="input-api-key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your key at{" "}
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    openrouter.ai/keys
                  </a>
                  . Never stored anywhere.
                </p>
              </CardContent>
            </Card>

            {/* Model selection */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  Select Models
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
              </CardContent>
            </Card>

            {/* Custom prompt (optional) */}
            <div>
              <button
                onClick={() => setShowCustomPrompt(v => !v)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-custom-prompt"
              >
                <Plus className="w-4 h-4" />
                {showCustomPrompt ? "Hide" : "Add"} custom instructions (optional)
              </button>
              {showCustomPrompt && (
                <div className="mt-3 fade-in-up">
                  <Textarea
                    placeholder="e.g. Focus especially on data privacy clauses and GDPR compliance. Flag any clauses that allow sharing data with third parties..."
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    className="text-sm resize-none"
                    rows={3}
                    data-testid="textarea-custom-prompt"
                  />
                </div>
              )}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleAnalyze}
              disabled={!state.apiKey || state.selectedModels.length === 0}
              data-testid="button-analyze"
            >
              Analyze Contract <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 3: Analyzing */}
        {state.step === "analyzing" && (
          <div className="fade-in-up space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Analyzing your contract...</h2>
              <p className="text-sm text-muted-foreground">Running {totalCount} model{totalCount > 1 ? "s" : ""} in parallel</p>
            </div>
            <Progress value={(doneCount / totalCount) * 100} className="h-2" />
            <div className="space-y-3">
              {state.results.map(r => (
                <Card key={r.modelId} className="border-border">
                  <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      r.status === "done" ? "bg-green-500" :
                      r.status === "error" ? "bg-red-500" :
                      "bg-yellow-400 animate-pulse"
                    }`} />
                    <span className="text-sm font-medium flex-1">{r.modelName}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.status === "done" ? "✓ Done" :
                       r.status === "error" ? "✗ Error" :
                       "Reading..."}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {(state.step === "results" || (state.step === "analyzing" && allDone)) && state.results.length > 0 && (
          <div className="fade-in-up space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Analysis Results</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{state.file?.name}</span>
              </div>
            </div>

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
                    {r.status === "loading" && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse mr-1.5" />}
                    {r.status === "done" && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />}
                    {r.status === "error" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />}
                    {r.modelName}
                  </TabsTrigger>
                ))}
              </TabsList>

              {state.results.map(result => (
                <TabsContent key={result.modelId} value={result.modelId} className="space-y-6 mt-4">
                  {result.status === "error" && (
                    <Card className="border-destructive bg-destructive/5">
                      <CardContent className="pt-5 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm">Analysis failed</p>
                          <p className="text-xs text-muted-foreground">{result.error}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {result.status === "loading" && (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 rounded-xl shimmer" />
                      ))}
                    </div>
                  )}

                  {result.status === "done" && (
                    <>
                      {/* Top row: Score + Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border-border flex items-center justify-center py-6">
                          <div className="text-center space-y-3">
                            <TrustScoreRing score={result.trustScore} size={120} />
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Trust Score</p>
                              {result.jurisdiction && result.jurisdiction !== "Unknown" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  📍 {result.jurisdiction}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                        <Card className="border-border sm:col-span-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm leading-relaxed">{result.summary}</p>
                            <div className="flex gap-3 pt-1">
                              {[
                                { label: "Critical", count: result.flags.filter(f => f.severity === "CRITICAL").length, color: "text-red-500" },
                                { label: "Suspect", count: result.flags.filter(f => f.severity === "SUSPECT").length, color: "text-orange-500" },
                                { label: "Minor", count: result.flags.filter(f => f.severity === "MINOR").length, color: "text-yellow-600" },
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
                            <CardTitle className="text-sm">5 Dimensions</CardTitle>
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

                      {/* Flags */}
                      {result.flags.length === 0 ? (
                        <Card className="border-border bg-green-50 dark:bg-green-950/20">
                          <CardContent className="pt-5 flex items-center gap-3">
                            <span className="text-2xl">✅</span>
                            <p className="text-sm font-medium">No significant issues found. This contract looks fair!</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="border-border">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              Flagged Clauses
                              <Badge variant="secondary">{result.flags.length} issues</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {[...result.flags]
                              .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
                              .map((flag, idx) => (
                                <div
                                  key={flag.id || idx}
                                  className="rounded-lg border border-border p-4 space-y-2 hover:bg-muted/30 transition-colors"
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

            <Button variant="outline" onClick={reset} className="w-full sm:w-auto" data-testid="button-analyze-another">
              <RefreshCw className="w-4 h-4 mr-2" /> Analyze Another Contract
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M 8 22 C 5 22 3 20 3 17 L 3 6 C 3 3 5 1 8 1 C 11 1 13 3 13 6 L 13 17 C 13 19 11.5 20.5 9.5 20.5 C 7.5 20.5 6 19 6 17 L 6 8" stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
            <span>clippy — open source contract analyzer</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/paulfleury/clippy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Github className="w-3.5 h-3.5" /> Star on GitHub
            </a>
            <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Powered by OpenRouter
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
