/**
 * @file ShareView.tsx
 * @description Read-only results page for shared Clippy analysis links.
 * @version 3.0.0
 *
 * OVERVIEW
 * --------
 * When a user generates a "Share URL" from the results page, the URL looks like:
 *   https://clippy.legal/#/share/BASE64_ENCODED_JSON
 *
 * This page intercepts that route, decodes the base64 payload from the URL hash,
 * and renders the results in a read-only display — identical visually to the
 * main results dashboard in Home.tsx, but without any editing capabilities.
 *
 * ROUTE
 * -----
 * Registered in App.tsx as: <Route path="/share/:payload" component={ShareView} />
 *
 * The `:payload` route parameter (via wouter) contains everything after
 * `#/share/`, which is the base64-encoded SharePayload JSON.
 *
 * PRIVACY
 * -------
 * The share payload never includes the API key — only the analysis results,
 * filename, timestamp, and enabled prompt titles. The full SharePayload schema
 * is defined in shared/schema.ts.
 *
 * ERROR HANDLING
 * --------------
 * If the payload cannot be decoded (corrupted URL, truncated share link, etc.),
 * this component shows a friendly error state rather than crashing.
 *
 * The decodeSharePayload() function in share.ts is designed to return null
 * on any decoding failure — this component renders accordingly.
 *
 * i18n
 * ----
 * All user-visible strings are translated via useI18n() / t(). The LanguageSwitcher
 * component is included in the header so visitors can switch language on the share page.
 */

import { useMemo } from "react";
import { useParams } from "wouter";
import { Github, AlertTriangle, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrustScoreRing } from "@/components/TrustScoreRing";
import { ClippyCharacter } from "@/components/ClippyCharacter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { decodeSharePayload } from "@/lib/share";
import { useI18n } from "@/lib/i18n";
import type { Severity } from "@shared/schema";

// ---------------------------------------------------------------------------
// Severity helpers (duplicated from Home.tsx — self-contained for clarity)
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<Severity, number> = { CRITICAL: 0, SUSPECT: 1, MINOR: 2 };

/**
 * Severity badge pill component for the flags list.
 * Uses the same CSS classes as Home.tsx for visual consistency.
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
 * Dimension score bar — same as in Home.tsx for visual consistency.
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
// Main component
// ---------------------------------------------------------------------------

/**
 * Read-only results viewer for shared Clippy analysis links.
 *
 * Reads the `:payload` route parameter, decodes it via decodeSharePayload(),
 * and renders the results dashboard in a non-interactive mode.
 *
 * The component handles three states:
 *   1. Valid payload → full results dashboard
 *   2. Invalid/corrupt payload → friendly error with a link back to the app
 *   3. Missing payload → redirect to home (handled by wouter route matching)
 *
 * All user-visible strings are translated via the `t()` helper from useI18n().
 */
export default function ShareView() {
  // wouter passes route params (`:payload`) via useParams
  const params = useParams<{ payload: string }>();
  const rawPayload = params.payload || "";

  // i18n — provides t() for all translated strings
  const { t } = useI18n();

  /**
   * Decode the payload once on mount (or when rawPayload changes).
   * Returns null if decoding fails for any reason.
   */
  const payload = useMemo(() => {
    if (!rawPayload) return null;
    return decodeSharePayload(rawPayload);
  }, [rawPayload]);

  // ---------------------------------------------------------------------------
  // Error state — corrupted or invalid share link
  // ---------------------------------------------------------------------------

  if (!payload) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        {/* Clippy mascot with a confused message */}
        <ClippyCharacter message={t("clippy.share_invalid")} size="md" />
        <div className="mt-8 text-center space-y-4 max-w-md">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-semibold">{t("share.invalid_title")}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("share.invalid_desc")}
          </p>
          <Button asChild variant="default">
            <a href="/">
              <ExternalLink className="w-4 h-4 mr-2" /> {t("share.invalid_button")}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Shared results view
  // ---------------------------------------------------------------------------

  const { fileName, analyzedAt, prompts: promptTitles, results, version } = payload;
  const analyzedDate = new Date(analyzedAt).toLocaleString();

  return (
    <div className="min-h-screen bg-background">

      {/* Header — sticky, shows logo + share badge + language switcher */}
      <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Clippy logo mark */}
            <svg viewBox="0 0 32 32" width="26" height="26" fill="none" aria-label="Clippy logo">
              <path d="M 11 28 C 7 28 4 25 4 21 L 4 8 C 4 4 7 1 11 1 C 15 1 18 4 18 8 L 18 21 C 18 23.2 16.2 25 14 25 C 11.8 25 10 23.2 10 21 L 10 10"
                    stroke="#C8A800" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M 11 28 C 7 28 4 25 4 21 L 4 8 C 4 4 7 1 11 1 C 15 1 18 4 18 8 L 18 21 C 18 23.2 16.2 25 14 25 C 11.8 25 10 23.2 10 21 L 10 10"
                    stroke="#F5D000" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="font-bold text-base tracking-tight">{t("nav.brand")}</span>
            <span className="hidden sm:inline text-muted-foreground text-sm select-none">·</span>
            <span className="hidden sm:inline text-xs text-muted-foreground tracking-wide">your contract analyst</span>
            {/* "shared report" badge — translated */}
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              {t("nav.shared_badge")}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Link back to the main app */}
            <Button variant="ghost" size="sm" asChild>
              <a href="/">{t("share.analyze_own")}</a>
            </Button>
            {/* GitHub link */}
            <a
              href="https://github.com/paulfxyz/clippy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">{t("nav.github")}</span>
            </a>
            {/* Language switcher — so share page visitors can also switch languages */}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ---- Report metadata banner ---- */}
        <Card className="border-border bg-primary/5 border-primary/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <p className="font-bold">{fileName}</p>
                {/* "Analyzed on <date>" — translated with {{date}} interpolation */}
                <p className="text-sm text-muted-foreground">
                  {t("share.analyzed_on", { date: analyzedDate })}
                </p>
                {promptTitles?.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("share.objectives", { list: promptTitles.join(", ") })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* "N model(s)" badge — plural-aware via separate key */}
                <Badge variant="outline" className="text-xs">
                  {results.length !== 1
                    ? t("share.models_badge_plural", { count: results.length })
                    : t("share.models_badge",        { count: results.length })}
                </Badge>
                {/* Version badge */}
                <Badge variant="outline" className="text-xs">
                  {t("share.version_badge", { version })}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---- Read-only disclaimer — translated ---- */}
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-start gap-3">
          <span className="text-lg">📎</span>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("share.disclaimer")}{" "}
            <a href="https://clippy.legal" className="text-primary hover:underline">clippy.legal</a>.
          </p>
        </div>

        {/* ---- Results tabs — one tab per model ---- */}
        {results.length > 0 && (
          <Tabs defaultValue={results[0].modelId}>
            <TabsList className="flex-wrap h-auto gap-1 p-1">
              {results.map(r => (
                <TabsTrigger
                  key={r.modelId}
                  value={r.modelId}
                  data-testid={`tab-model-${r.modelId}`}
                  className="text-xs py-1.5"
                >
                  {r.status === "done"  && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />}
                  {r.status === "error" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />}
                  {r.modelName}
                </TabsTrigger>
              ))}
            </TabsList>

            {results.map(result => (
              <TabsContent key={result.modelId} value={result.modelId} className="space-y-6 mt-4">

                {/* ---- Error state ---- */}
                {result.status === "error" && (
                  <Card className="border-destructive bg-destructive/5">
                    <CardContent className="pt-5 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                      <div>
                        {/* "Analysis failed" — translated */}
                        <p className="font-semibold text-sm">{t("step3.analysis_failed")}</p>
                        <p className="text-xs text-muted-foreground">{result.error}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ---- Done state — full read-only dashboard ---- */}
                {result.status === "done" && (
                  <>
                    {/* Top row: Trust score ring + Summary card */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card className="border-border flex items-center justify-center py-6">
                        <div className="text-center space-y-3">
                          <TrustScoreRing score={result.trustScore} size={120} />
                          <div>
                            {/* "Trust Score" label — translated */}
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

                      {/* Summary card */}
                      <Card className="border-border sm:col-span-2">
                        <CardHeader className="pb-2">
                          {/* "Summary" — translated */}
                          <CardTitle className="text-sm">{t("step3.summary")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm leading-relaxed">{result.summary}</p>
                          {/* Severity counts — labels translated */}
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

                    {/* ---- 5 Dimensions card ---- */}
                    {result.dimensions.length > 0 && (
                      <Card className="border-border">
                        <CardHeader className="pb-3">
                          {/* "5 Dimensions" — translated */}
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

                    {/* ---- Flagged clauses — or no-issues green card ---- */}
                    {result.flags.length === 0 ? (
                      <Card className="border-border bg-green-50/60 dark:bg-green-950/20">
                        <CardContent className="pt-5 flex items-center gap-3">
                          <span className="text-2xl">✅</span>
                          {/* "No significant issues found" — translated */}
                          <p className="text-sm font-medium">
                            {t("step3.no_issues")}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {/* "Flagged Clauses" + issue count badge — translated */}
                            {t("step3.flagged_clauses")}
                            <Badge variant="secondary">
                              {t("step3.issues", { count: result.flags.length })}
                            </Badge>
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
        )}

        {/* ---- CTA — encourage visitors to run their own analysis ---- */}
        <Card className="border-border bg-primary/5 border-primary/20">
          <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              {/* CTA title + subtitle — translated */}
              <p className="font-semibold text-sm">{t("share.cta_title")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("share.cta_subtitle")}
              </p>
            </div>
            <Button asChild>
              <a href="/">
                {t("share.cta_button")} <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer — translated, version bumped to v3.0.0 */}
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
            <span>clippy v3.0.0 — {t("footer.tagline")}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/paulfxyz/clippy" target="_blank" rel="noopener noreferrer"
               className="hover:text-foreground transition-colors flex items-center gap-1">
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
            <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer"
               className="hover:text-foreground transition-colors">
              {t("footer.powered_by")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
