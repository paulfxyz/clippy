# Changelog

All notable changes to Clippy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.1.0] — 2026-04-14

### Fixed
- Logo image: removed stray "dot ·" text, re-centered tagline to "your contract analyst"
- README: updated logo illustration with cache-busted URL
- `locale is not defined` crash during analysis — destructure `locale` from `useI18n()`

### Added
- "See Demo" button in hero with 3-step screenshot slideshow modal (keyboard nav, backdrop dismiss)

---

## [3.1.0] — 2026-04-14

Locale-aware analysis output. When Clippy's UI is set to any non-English language, AI models now respond entirely in that language — all human-readable fields in the JSON output (summary, flag titles, flag descriptions, dimension labels and notes) are written in the active locale. Contract quotes remain verbatim in the original document language. JSON field names remain in English for structural consistency.

### Added

#### Locale-Aware AI Output (`client/src/lib/openrouter.ts`)
- `LOCALE_LANGUAGE_NAMES` — maps all 17 supported locale codes to their full English language names for use in model instructions
- `buildSystemPrompt(locale)` — dynamically builds the system prompt; for non-English locales, prepends a `LANGUAGE INSTRUCTION` directive at the top of the system prompt (highest attention weight position) directing the model to write all text fields in the active language
- `analyzeWithModel()` now accepts a `locale` parameter (default `"en"`); passed from `Home.tsx` via `useI18n()`

#### Locale Language Reminder (`client/src/lib/prompts.ts`)
- `assemblePromptInstructions(prompts, locale)` — accepts locale param and appends a `REMINDER` line to the user message for non-English locales (belt-and-suspenders alongside the system prompt directive)
- `LOCALE_LANGUAGE_NAMES` re-exported from `openrouter.ts` and imported in `prompts.ts`

#### Home.tsx
- `handleAnalyze()` now passes `locale` (from `useI18n()`) to `analyzeWithModel()`

### Changed
- File header versions updated to v3.1.0 in `openrouter.ts` and `prompts.ts`

---

## [3.1.0] — 2026-04-14

A quality and depth patch. Deeply improved analysis prompts that cite specific laws and legal concepts, a richer system prompt with better severity calibration, hardened error handling, improved code comments throughout, and a massively expanded README covering EU/US/UK/FR consumer law, GDPR, arbitration jurisprudence, non-compete law, and IP assignment rules.

### Added

#### Legally Grounded Analysis Prompts (`client/src/lib/prompts.ts`)
- **`general-red-flags`** — Now cites EU Directive 93/13/EEC (significant imbalance test, Annex grey list), UK CRA 2015 ss.62-65, US unconscionability doctrine, and French Code de la consommation Art. L.212-1 and Décret 2009-302 "black list"
- **`general-termination`** — Now cites French Loi Châtel (Art. L.215-1), EU consumer auto-renewal rules, GDPR Art. 17 (data erasure on termination), and specific criteria for what constitutes a disproportionate termination penalty
- **`general-governing-law`** — Now cites EU Rome I Regulation Art. 6 (choice of law cannot strip mandatory consumer protections), Brussels I Recast Art. 17-19, FAA (9 U.S.C.), AT&T Mobility v. Concepcion (563 U.S. 333, 2011), American Express v. Italian Colors (2013), UK CRA 2015 s.91, and the 2022 Ending Forced Arbitration Act
- **`financial-pricing`** — Now cites EU Directive 93/13/EEC Annex item (l) (unilateral price changes), French "black list" (Décret 2009-302), EU Late Payments Directive 2011/7/EU
- **`financial-liability`** — Now cites UK UCTA 1977 s.11 (reasonableness test), UK CRA 2015 s.65 (death/personal injury), EU Directive 93/13/EEC Annex items (a)/(b), French Code civil Art. 1231-3
- **`privacy-gdpr`** — Now provides a detailed breakdown of all relevant GDPR Articles: Art. 5 (principles), Art. 6 (lawful basis with all 6 bases listed), Art. 7 (consent conditions), Art. 13 (all mandatory transparency elements), Art. 17 (erasure), Art. 20 (portability), Art. 28 (DPA requirements), Arts. 44-49 (international transfers, SCCs, post-Schrems II), Art. 25 (data protection by design)
- **`privacy-monitoring`** — Now cites US ECPA (18 U.S.C. § 2510), EU GDPR Art. 6(1)(f) for monitoring, Article 29 Working Party Opinion 2/2017, GDPR Art. 9 for biometric data
- **`employment-noncompete`** — Now provides a jurisdiction table: California (§ 16600, near-total ban, no blue-pencilling), Minnesota (§ 181.988, banned since 2023), North Dakota, Florida, New York, UK (Mason v. Provident Clothing [1913]), France (Cass. Soc. 10 juillet 2002, mandatory compensation), Germany (HGB §§ 74-75, 50% salary minimum), FTC 2024 rule
- **`employment-ip-assignment`** — Now cites US 17 U.S.C. § 101 (work made for hire), California Labor Code § 2870 (personal-time carve-out), UK Patents Act 1977 s.39 and CDPA 1988 s.11, French Code de la Propriété Intellectuelle (inalienable moral rights), and covers Delaware/Illinois/Minnesota/NC/Washington equivalent protections
- **`ip-licensing`** — Now covers irrevocable/royalty-free/sublicensable licence analysis, AI training data consent under GDPR, grant-back clause antitrust concerns, freelance work-made-for-hire under 17 U.S.C. § 101, FOSS copyleft compliance (GPL, LGPL, AGPL)
- **`assemblePromptInstructions()`** — Enhanced preamble that explicitly instructs the model to reflect all objectives in the JSON output (flags, dimensions, trustScore)

#### Improved System Prompt (`client/src/lib/openrouter.ts`)
- **Legal framework section** — SYSTEM_PROMPT now opens with an explicit list of applicable legal standards (EU Directive 93/13/EEC, GDPR, Rome I, FAA, AT&T v. Concepcion, UK CRA 2015, French consumer law)
- **Richer severity calibration** — CRITICAL/SUSPECT/MINOR definitions now include 6-7 concrete legal examples each, anchored to specific laws
- **Better JSON schema documentation** — Each field in the JSON schema now has a clear description of expected values and format
- **Dimension notes** — Each of the 5 dimensions now has a descriptive `label` guidance (`Excellent|Good|Fair|Poor|Opaque` for Transparency, etc.)
- **Instruction to detect jurisdiction** — Model is now explicitly instructed to identify governing law from contract content
- **Hardened instructions** — Added: minimum/maximum flag counts, instruction not to hallucinate quotes, trustScore range guidance

#### Hardened Error Handling (`client/src/lib/openrouter.ts`)
- **HTTP 401** → "Invalid API key — please check your OpenRouter key and try again"
- **HTTP 402** → "Insufficient OpenRouter credits — top up your account at openrouter.ai"
- **HTTP 403** → "Access denied — your API key may not have permission to use this model"
- **HTTP 429** → "Rate limit reached — please wait a moment before trying again"
- **HTTP 502/503** → "Model temporarily unavailable — try a different model or retry in a moment"
- **Three-layer JSON parsing fallback**: (1) direct parse; (2) strip Markdown code fences; (3) extract first `{...}` JSON object from mixed-content response

#### Improved File Parser (`client/src/lib/fileParser.ts`)
- **File size limit** — Files above 10MB are rejected with a clear error message before any parsing begins
- **Scanned PDF detection** — If all PDF pages combined yield fewer than 100 characters, a descriptive error explains that the PDF is likely image-only (scanned) with no text layer
- **Password-protected PDF error** — `PasswordException` from pdfjs-dist is now caught and surfaced as a clear user-facing message with remediation advice
- **Empty DOCX detection** — `mammoth.extractRawText()` result is now validated; empty results surface a clear error
- **Empty TXT/MD detection** — `File.text()` result is validated; empty files surface a clear error
- **DOCX error handling** — `mammoth.extractRawText()` is now wrapped in try/catch with user-friendly error message

#### Legal Disclaimer in Exports (`client/src/lib/export.ts`)
- **PDF footer** — Every page now includes a legal disclaimer: "AI-generated analysis. Not legal advice. Consult a qualified lawyer before acting on any finding."
- **Markdown footer** — Enhanced footer with explicit disclaimer: "Results are AI-generated and do not constitute legal advice."
- **PDF cover** — Subtitle updated to include tagline: "clippy.legal — open-source AI contract analyzer · your contract analyst"

#### Share URL Robustness (`client/src/lib/share.ts`)
- **Enhanced structural validation** — `decodeSharePayload()` now also validates that each result in the array has a `modelId` field
- **Improved JSDoc** — All functions now have detailed comments explaining encoding steps, Unicode handling, and failure modes

#### README.md — Major Expansion
- **New section: "The Legal Context — Why Contract Clauses Matter"** — 2,000+ words covering:
  - EU Directive 93/13/EEC (text, CJEU cases: Océano Grupo, Aziz, RWE Vertrieb)
  - GDPR article-by-article table (Arts. 5-7, 13, 17, 20, 25, 28, 44-49) with enforcement cases (CNIL/Google, DPC/WhatsApp, Schrems II)
  - US law: unconscionability doctrine, FAA, AT&T v. Concepcion, American Express v. Italian Colors, Viking River Cruises, ECPA
  - Non-compete enforceability by jurisdiction (CA, MN, ND, FL, NY, UK, FR)
  - UK CRA 2015 and UCTA 1977
  - French Loi Châtel, Loi Hamon, Code de la consommation
  - Arbitration clause analysis (EU vs. US vs. UK positions)
  - IP assignment (UK, US, France) including California Labor Code § 2870
  - Liability caps and indemnification structure analysis
  - Governing law and forum selection (Rome I, Brussels I Recast)
  - The "small print" problem (cognitive overload, information asymmetry)
  - Limitations of AI contract analysis and threat model
- **Legal References section** — 10 direct links to official legal texts (EUR-Lex, US Code, California Legislature, etc.)
- **Version badge** updated to v3.1.0
- **Roadmap** updated to reflect completed milestones
- **v3.1.0 "What's New"** section added

### Changed

- `package.json` — Version bumped from `3.1.0` → `3.1.0`
- `CHANGELOG.md` — This entry
- `README.md` — Version badge updated to v3.1.0; major content expansion

### Fixed

- JSON parsing in `analyzeWithModel()` now has a third fallback (regex extraction of first `{...}` block) to handle models that prepend preamble text before the JSON
- Error message for `decodeSharePayload()` failures is now more specific in documentation (though the function itself returns null silently as designed)

---

## [3.1.0] — 2026-04-13

This is a major internationalisation (i18n) release. Clippy now speaks 17 languages — English plus 16 others — with full RTL support for Arabic and Hebrew, automatic locale detection, a beautiful language switcher in the navigation bar, and zero external i18n libraries.

### Added

#### Full i18n System (`client/src/lib/i18n.ts`)
- **17 languages** — English (default), French, Spanish, Portuguese, German, Dutch, Italian, Chinese (Simplified), Russian, Hindi, Bulgarian, Polish, Danish, Japanese, Korean, Hebrew, Arabic
- **`I18nProvider`** — React context provider that wraps the entire app. Detects the user's locale on mount, applies RTL direction on the `<html>` element for Arabic and Hebrew, and exposes `setLocale()` for the language switcher.
- **`useI18n()`** — Hook that returns `{ locale, setLocale, t, isRtl }`. Every component that needs translations calls this hook.
- **`t(key, vars?)`** — Translation helper with `{{variable}}` interpolation. Falls back to English for any missing key in any locale — no crashes, ever.
- **`detectLocale()`** — Locale detection pipeline: `localStorage["clippy_locale"]` → `navigator.language` → `"en"`. Preferences persist across sessions.
- **`SUPPORTED_LOCALES`** — Manifest of all 17 locales with code, native name, flag emoji, HTML lang attribute, and RTL flag.
- **RTL support** — Arabic (`ar`) and Hebrew (`he`) automatically set `dir="rtl"` on `<html>`. Tailwind's logical-property utilities (`start`/`end`) handle layout mirroring without extra CSS.
- **`{{variable}}` interpolation** — Keys like `"share.analyzed_on"` accept a `vars` object: `t("share.analyzed_on", { date: "Jan 1" })` → `"Analyzed on Jan 1"`. Used throughout for dynamic counts, filenames, dates.
- **No external library** — No i18next, no react-intl, no format.js. The entire i18n system is 1634 lines of plain TypeScript with zero runtime dependencies beyond React.

#### Language Switcher (`client/src/components/LanguageSwitcher.tsx`)
- **Flag grid dropdown** — 4-column grid of flag emojis + native language names. Opens on click, closes on outside-click or Escape.
- **Active locale highlight** — Current language is highlighted with the primary (yellow) accent color.
- **Present on all pages** — Visible in both `Home.tsx` (main app) and `ShareView.tsx` (shared report view), so visitors who receive a share link can also switch languages.
- **`dir="ltr"` forced on container** — The dropdown always renders left-to-right internally, even when the page is in RTL mode, so the 4-column flag grid looks correct in Arabic/Hebrew.

#### Brand & UX Improvements
- **Logo tagline** — "· your contract analyst" added to the logo in both `Home.tsx` and `ShareView.tsx`, giving the brand a clearer one-line pitch visible on every page.
- **LanguageSwitcher in ShareView** — Share page visitors can switch languages; all strings including disclaimer, CTA, and footer are translated.

### Changed

- **`Home.tsx`** — All ~60 user-visible strings replaced with `t()` calls. Toast notifications, step placeholders, navigation labels, footer, speech bubbles, and category labels are all translated. `CLIPPY_MESSAGES` dictionary replaced by `CLIPPY_MESSAGE_KEYS` (key-based; resolved at render via `t()`). `setClippy()` now accepts a translation key string instead of a raw message.
- **`ShareView.tsx`** — Fully rewritten to use `useI18n()`. All strings (header badges, metadata banner, disclaimer, results labels — Trust Score, Summary, 5 Dimensions, Flagged Clauses, Analysis failed, No significant issues found — CTA, footer) are now translated. `LanguageSwitcher` added to the header.
- **`App.tsx`** — Wrapped with `<I18nProvider>` at the top level so all routes inherit the same locale state.
- **`package.json`** — Version bumped from `2.0.0` → `3.1.0`.
- **README.md** — Major update: i18n architecture section, 17-language table, RTL design decisions, `{{variable}}` interpolation examples, logo tagline change, vibe-coding disclaimer.
- **CHANGELOG.md** — This entry.

### Technical Details

#### Translation Key Groups
| Group | Examples | Description |
|-------|---------|-------------|
| `nav.*` | `nav.brand`, `nav.github`, `nav.version_badge` | Navigation bar strings |
| `steps.*` | `steps.setup`, `steps.objectives`, `steps.results` | Step indicator labels |
| `clippy.*` | `clippy.setup`, `clippy.file_loaded` | Speech bubble messages |
| `step1.*` | `step1.title`, `step1.drop_title`, `step1.api_key_label` | Setup step UI |
| `step2.*` | `step2.title`, `step2.add_custom`, `step2.run_button` | Prompts step UI |
| `step3.*` | `step3.trust_score`, `step3.flagged_clauses` | Results dashboard |
| `share.*` | `share.analyzed_on`, `share.disclaimer`, `share.cta_title` | Share page strings |
| `footer.*` | `footer.tagline`, `footer.powered_by` | Footer strings |
| `toast.*` | `toast.pdf_downloaded`, `toast.url_copied` | Toast notifications |
| `lang.*` | `lang.label`, `lang.select` | Language switcher UI |
| `cat.*` | `cat.general`, `cat.financial`, `cat.privacy` | Prompt category labels |

#### RTL Implementation
Arabic and Hebrew locales are detected in `I18nProvider` via `RTL_LOCALES.has(locale)`. A `useEffect` sets `document.documentElement.dir` to `"rtl"` or `"ltr"` as appropriate. Because Tailwind CSS uses logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) rather than physical `left`/`right`, most of the layout mirrors automatically. No additional CSS was required.

#### Locale Detection Order
```
localStorage["clippy_locale"]  →  navigator.language prefix match  →  "en" fallback
```

### Dependencies

No new dependencies added. The i18n system is zero-dependency beyond React.

---

## [2.0.0] — 2026-04-14

This is a major feature release that transforms Clippy from a single-shot contract analyzer into a full-featured contract intelligence platform. The UI has been completely rewritten with a 3-step wizard flow, a modular prompt library, client-side encryption, PDF/Markdown export, and shareable result URLs.

### Added

#### 3-Step Wizard Flow
- **New Step 1 "Setup"** — File upload + API key entry (with AES-GCM encryption) + model selection, all in one clean step
- **New Step 2 "Objectives"** — Full-screen prompt library editor; replace the v1 single textarea with a rich toggle/edit/add interface
- **New Step 3 "Results"** — Live parallel analysis + complete results dashboard (unchanged from v1 in features; enhanced with export and share)
- **Step progress indicator** — Visual 3-step progress bar at the top of the wizard showing current position
- **Step navigation** — Back button on Step 2 returns to Step 1; "New Analysis" header button resets to Setup

#### Modular Prompt Library (`client/src/lib/prompts.ts`)
- **10 curated analysis objectives** across 5 categories: General (3), Financial (2), Privacy (2), Employment (2), IP (1)
- **Toggle objectives on/off** — Switch component per objective; General objectives enabled by default, others opt-in
- **Edit objectives inline** — Any prompt title, description, or instruction text can be edited directly in Step 2
- **Add custom objectives** — "Add custom objective" button creates a new blank prompt in the Custom category
- **Delete custom objectives** — User-created prompts can be deleted (built-in prompts cannot)
- **Category display** — Prompts grouped by category with color-coded category badges
- **Prompt assembly** — `assemblePromptInstructions(prompts[])` concatenates enabled prompts into a formatted instruction block for the API
- **`createCustomPrompt()`** utility — generates a new blank AnalysisPrompt with a collision-resistant ID

#### AES-GCM API Key Encryption (`client/src/lib/encryption.ts`)
- **`encryptKey(plaintext)`** — Encrypts the API key using AES-GCM 256-bit via `window.crypto.subtle`; generates a random 12-byte IV per encryption; returns a base64 blob containing `[IV | ciphertext | auth tag]`
- **`decryptKey(encrypted)`** — Decrypts the base64 blob back to the raw key just-in-time before each API call
- **`maskKey(key)`** — Returns a partially-masked display string (first 12 chars + dots) for UI display
- **Lock/Unlock UI** — "Lock" button encrypts the key and replaces the raw input with a masked locked display; "Change" button clears and unlocks for re-entry
- **Session-scoped key** — The AES CryptoKey is generated once on first use, lives in the JS heap, is never exported or serialized, and is wiped on tab close

#### PDF & Markdown Export (`client/src/lib/export.ts`)
- **`downloadAsPDF(context, fileName?)`** — Generates a multi-page A4 PDF report using jsPDF. Includes: cover header with contract metadata, per-model sections with trust score badge, summary, flag counts, dimension progress bars, and flagged clauses with severity color coding and verbatim quotes. Automatic page breaks for long results.
- **`downloadAsMarkdown(context, fileName?)`** — Generates a GitHub-compatible `.md` report with headers, a metadata table, per-model sections, dimension score tables (with ASCII bar charts), and flagged clauses as blockquotes. Built using native Blob URL — zero external dependencies.
- **Export buttons in Results** — "PDF" and "Markdown" download buttons appear in the results toolbar when all models complete
- Both exports are 100% client-side; no server roundtrip

#### Shareable Result URLs (`client/src/lib/share.ts`)
- **`encodeSharePayload(payload)`** — Serializes a SharePayload to base64 via `JSON.stringify → encodeURIComponent → btoa`
- **`decodeSharePayload(encoded)`** — Decodes a share URL fragment back to SharePayload; returns `null` on any failure (corrupted URL, truncated link, missing fields)
- **`buildShareUrl(payload)`** — Constructs the full `https://clippy.legal/#/share/BASE64` URL
- **"Share URL" button** — Appears in Results toolbar when all models complete; encodes results, generates URL, copies to clipboard, shows toast confirmation
- **Share URL display field** — Inline read-only input field showing the generated URL with a copy button

#### ShareView Page (`client/src/pages/ShareView.tsx`)
- **New `/share/:payload` route** — Registered in App.tsx; renders read-only results for shared links
- **Automatic payload decoding** — `useMemo(() => decodeSharePayload(params.payload))` on mount
- **Full read-only results dashboard** — Trust score ring, summary, flag counts, dimension bars, flagged clauses — identical visually to Home.tsx results
- **Report metadata banner** — Shows filename, analysis timestamp, enabled objectives, model count, and Clippy version
- **Privacy disclaimer** — Explains that the contract was analyzed in the sharer's browser and this is not legal advice
- **"Try Clippy Free" CTA** — Prominent card at the bottom encouraging the viewer to analyze their own contract
- **Error state** — If the payload cannot be decoded, shows Clippy mascot with "Invalid Share Link" message and a link back to the main app

#### Schema Updates (`shared/schema.ts`)
- **`AnalysisPrompt` type** — New type for the prompt library: `{ id, title, description, prompt, category, enabled, isDefault, isCustom }`
- **`AppStep` type** — `"setup" | "prompts" | "results"` (replaces v1's `"upload" | "config" | "analyzing" | "results"`)
- **`AppState` type** — Updated with `prompts: AnalysisPrompt[]`, `apiKeyEncrypted: string`, `fileName: string`, and `step: AppStep`
- **`SharePayload` type** — New type for URL-encoded shared results: `{ version, fileName, analyzedAt, prompts (titles), results }`
- **`ModelResult.durationMs`** — New optional field: wall-clock time for the API call in milliseconds

#### OpenRouter Updates (`client/src/lib/openrouter.ts`)
- **`prompts: AnalysisPrompt[]` parameter** — Replaces the v1 `customPrompt?: string` parameter. All enabled prompts are assembled via `assemblePromptInstructions()` and prepended to the user message.
- **`durationMs` in return value** — Wall-clock time from request start to parsed response, added to the result object

#### App.tsx
- **`/share/:payload` route** — Added `<Route path="/share/:payload" component={ShareView} />` to the router
- **Thorough JSDoc** — Full file-level documentation with routing architecture notes

### Changed

- **Home.tsx — complete rewrite** — The main page is now a full 3-step wizard. Previous `"upload"`, `"config"`, and `"analyzing"` steps are reorganized into `"setup"`, `"prompts"`, and `"results"`. The results dashboard itself is unchanged in structure but enhanced with export/share buttons.
- **`analyzeWithModel()` signature** — Breaking change: `customPrompt?: string` → `prompts: AnalysisPrompt[]`. Code calling this function directly must be updated.
- **API key handling** — Raw API key is no longer persisted in React state after locking. The encrypted blob is stored in `apiKeyEncrypted`; raw key is cleared from `apiKey`.
- **README.md** — Completely rewritten and expanded with v2 architecture diagrams, prompt library documentation, share URL design, encryption model explanation, and updated roadmap.
- **CHANGELOG.md** — This entry.

### Fixed

- TypeScript error in `encryption.ts`: `String.fromCharCode(...Uint8Array)` replaced with `String.fromCharCode(...Array.from(Uint8Array))` to avoid `--downlevelIteration` requirement with typed array spread
- GitHub URL in footer and header corrected from `paulfleury` to `paulfxyz` (the actual GitHub account)

### Removed

- `customPrompt` local state from Home.tsx — replaced by the full prompt library in Step 2
- `"config"` and `"analyzing"` step values from `AppStep` — replaced by `"setup"` and `"results"` (loading state is now shown as part of the results step)

### Dependencies

No new dependencies added — all required packages (`jspdf`, `html2canvas`, `mammoth`, `pdfjs-dist`) were already present from v1. html2canvas is installed but not used in v2 (jsPDF text API is used instead).

---

## [1.0.0] — 2026-04-14

### The initial public release of Clippy.

This version establishes the full core product: multi-model AI contract analysis running entirely in the browser, with zero server-side storage, zero tracking, and zero account requirements.

### Added

#### Application
- **4-step user flow**: Upload → Configure → Analyze → Results
- **File upload with drag & drop** — supports PDF, DOCX, TXT, and Markdown files up to 50MB
- **Client-side PDF extraction** using `pdfjs-dist` (pdf.js by Mozilla), worker loaded from cdnjs CDN
- **Client-side DOCX extraction** using `mammoth` — raw text extraction preserving paragraph structure
- **Plain text / Markdown** direct read via native `File.text()` Web API
- **OpenRouter API key input** with show/hide toggle — key held in React state only, never persisted
- **Model selection grid** — 8 pre-configured models with provider, description, and icon
- **Parallel model execution** — all selected models analyzed concurrently via `Promise.allSettled()`
- **Custom instructions textarea** — append any additional prompt before the contract text
- **Real-time progress indicators** — per-model loading state while analysis runs
- **Trust Score animated ring** — SVG circle with animated `stroke-dashoffset` transition, color-coded by score tier
- **Five analysis dimensions** — Transparency, Balance, Legal Compliance, Financial Risk, Exit Freedom — each with a 0–100 score, label, and note
- **Severity-flagged clauses** — CRITICAL / SUSPECT / MINOR, sorted by severity, each with title, description, and verbatim quote from the contract
- **Jurisdiction detection** — models attempt to identify applicable legal jurisdiction
- **Per-model result tabs** — switch between model results for direct comparison
- **Error handling per model** — individual model failures don't block other results from displaying
- **"New Analysis" reset** — clears file and results, retains API key and model selection for convenience
- **Clippy mascot** — hand-crafted inline SVG paperclip character with randomized blinking, wobble animation, and contextual speech bubbles

#### Models available out of the box
- `anthropic/claude-3.5-sonnet` — Claude 3.5 Sonnet (Anthropic)
- `anthropic/claude-3-haiku` — Claude 3 Haiku (Anthropic)
- `openai/gpt-4o` — GPT-4o (OpenAI)
- `openai/gpt-4o-mini` — GPT-4o Mini (OpenAI)
- `google/gemini-pro-1.5` — Gemini Pro 1.5 (Google)
- `mistralai/mistral-large` — Mistral Large (Mistral AI)
- `meta-llama/llama-3.1-70b-instruct` — Llama 3.1 70B Instruct (Meta)
- `deepseek/deepseek-r1` — DeepSeek R1 (DeepSeek)

#### Design & UI
- Warm cream paper palette (`#F5EDD6` background, `#F5D000` primary accent)
- Dotted paper texture on the drop zone (CSS `radial-gradient` pattern)
- Plus Jakarta Sans typography (loaded via Google Fonts)
- Dark mode CSS variables defined (`.dark` class) — toggle coming in v1.1.0
- Responsive layout (works on mobile, tablet, desktop)
- Sticky header with logo, "open source" badge, GitHub link
- Footer with GitHub star link and OpenRouter attribution

#### Technical
- React 18 + TypeScript + Vite
- Tailwind CSS v3 + shadcn/ui component library
- TanStack Query v5 for state management
- Wouter with `useHashLocation` for client-side routing (hash-based for iframe/static hosting compatibility)
- Express dev server (Vite middleware) — development only, not shipped in production build
- Static build output to `dist/public/` — zero server required in production
- MIT licensed, fully open source

#### Documentation
- `README.md` — full project documentation with architecture diagrams, cost estimates, under-the-hood explanations
- `INSTALL.md` — deployment guides for FTP, Cloudflare Pages, Vercel, Netlify, GitHub Pages, Fly.io
- `CHANGELOG.md` — this file
- `CONTRIBUTING.md` — contribution guidelines
- `SECURITY.md` — responsible disclosure policy
- `LICENSE` — MIT license text

#### Infrastructure
- Public GitHub repository at `github.com/paulfxyz/clippy`
- Live deployment at [clippy.legal](https://clippy.legal) (SiteGround FTP)
- GitHub release v1.0.0 with full release notes

### Known limitations in this release
- No dark mode toggle in UI (CSS variables are defined, toggle button comes in v1.1.0)
- No PDF export of results
- Password-protected PDFs will fail to parse (pdf.js cannot decrypt without the password)
- Very long contracts (>200 pages) may exceed some model context windows — models with 1M context (Gemini) handle this best
- The pdf.js CDN worker requires an internet connection even for locally-run instances

---

[3.1.0]: https://github.com/paulfxyz/clippy/releases/tag/v3.1.0
[3.1.0]: https://github.com/paulfxyz/clippy/releases/tag/v3.1.0
[2.0.0]: https://github.com/paulfxyz/clippy/releases/tag/v2.0.0
[1.0.0]: https://github.com/paulfxyz/clippy/releases/tag/v1.0.0
[Unreleased]: https://github.com/paulfxyz/clippy/compare/v3.1.0...HEAD
[3.1.0]: https://github.com/paulfxyz/clippy/compare/v3.1.0...v3.1.0
