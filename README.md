# 📎 Clippy — AI Contract Analyzer

<div align="center">

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║    📎  C L I P P Y                                           ║
║        your contract analyst                                  ║
║                                                               ║
║    "It looks like you're signing a contract.                 ║
║     Would you like help checking for nasty clauses?"         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

[![Version](https://img.shields.io/badge/version-3.2.3-F5D000?style=flat-square&labelColor=1a1a2e)](https://github.com/paulfxyz/clippy/releases/tag/v3.2.3)
[![License: MIT](https://img.shields.io/badge/license-MIT-000000?style=flat-square)](https://github.com/paulfxyz/clippy/blob/main/LICENSE)
[![Built with React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white&labelColor=20232a)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-API-7c3aed?style=flat-square)](https://openrouter.ai)
[![Zero Backend](https://img.shields.io/badge/backend-zero-22c55e?style=flat-square)](https://clippy.legal)
[![Status](https://img.shields.io/badge/status-live-22c55e?style=flat-square)](https://clippy.legal)
[![i18n](https://img.shields.io/badge/i18n-17%20languages-F5D000?style=flat-square)](https://clippy.legal)

![Clippy — your contract analyst](https://clippy.legal/img/logo.jpg?v=2)

**Open-source, browser-only AI contract analyzer — no backend, no uploads, no account required.**

[**Try it live →**](https://clippy.legal) · [Releases](https://github.com/paulfxyz/clippy/releases) · [CHANGELOG](./CHANGELOG.md) · [INSTALL](./INSTALL.md)

</div>

---

## What is Clippy?

Clippy reads your contract and flags the clauses that might get you into trouble — one-sided terms, auto-renewals, opaque arbitration clauses, non-competes you didn't notice. It runs multiple AI models in parallel so you can compare how GPT, Claude, Gemini, and others read the same document.

Everything runs in your browser. The contract never leaves your machine. The only external call is to [OpenRouter](https://openrouter.ai), which routes your request to the model you selected. Clippy has no backend, no database, and no account system.

---

## Features

- **Multi-model analysis** — run up to 8 models simultaneously (Claude, GPT, Gemini, Mistral, Llama, DeepSeek)
- **Trust Score** — a 0–100 score per model with animated ring visualization
- **5 analysis dimensions** — Transparency, Balance, Legal Compliance, Financial Risk, Exit Freedom
- **Severity-flagged clauses** — CRITICAL / SUSPECT / MINOR, each with title, description, and verbatim quote
- **Modular prompt library** — 10 curated objectives across 5 categories (General, Financial, Privacy, Employment, IP), all toggle/edit/add-able
- **PDF & DOCX parsing** — client-side, using pdfjs-dist v5 and mammoth.js
- **17-language UI** — EN, FR, ES, PT, DE, NL, IT, ZH, RU, HI, BG, PL, DA, JA, KO, HE, AR
- **Export** — download results as a formatted PDF report or GitHub-compatible Markdown
- **Share URL** — encode analysis results into a URL fragment; share without a server
- **API key encryption** — AES-GCM 256-bit, session-scoped via Web Crypto API
- **Zero backend** — static build, works on any CDN, FTP, or GitHub Pages host

---

## Tech Stack

Here's every non-trivial choice in the stack and why it was made.

### Frontend Framework: React 18 + TypeScript + Vite

React was the obvious choice for a component-heavy wizard UI. TypeScript catches entire classes of bugs at compile time — especially important when you're passing contract analysis results (complex nested objects) through many layers of components. Vite is fast enough that the feedback loop never gets in the way.

The Vite build produces content-hashed JS/CSS bundles, so CDN caches are invalidated automatically on each deploy. The one file that does **not** get a hash is `index.html` — which caused a painful caching bug in early testing (see War Stories). The fix was adding `Cache-Control: no-cache` to the `index.html` response in `.htaccess`.

### UI Components: shadcn/ui + Tailwind CSS

shadcn/ui gives you unstyled-but-accessible Radix UI primitives pre-wired with Tailwind classes. It's not a dependency you install — it's code you own. That means you can change anything without fighting a library's theming system.

Tailwind handles 99% of styling. The 1% exception is dynamic SVG values (like the `stroke-dashoffset` on the TrustScoreRing) where you need inline `style={}` because Tailwind can't generate arbitrary dynamic values at runtime.

The design uses a warm cream palette (`#F5EDD6` background, `#F5D000` primary) instead of the usual cold grey. This was intentional — legal documents are stressful; the UI should feel like paper, not a dashboard.

### Router: wouter with `useHashLocation`

Clippy needs client-side routing for the `/share/:payload` route but is deployed as a static site. Path-based routing (`/share/...`) would return a 404 from nginx unless you configure `try_files` for every route — error-prone on shared hosting.

Hash-based routing (`/#/share/...`) works on any server without configuration, because the fragment is never sent to the server. `wouter` is 1.5KB and covers exactly this use case. React Router would have been overkill.

### PDF Parsing: pdfjs-dist v5

pdf.js by Mozilla is the gold standard for client-side PDF parsing. Version 5 moved to ES modules (`.mjs` worker files), which introduced a nasty deployment problem on SiteGround's nginx (see War Stories). The fix required a blob URL strategy to avoid the MIME type error.

The worker is fetched at runtime, re-wrapped as a `text/javascript` Blob, and registered via `GlobalWorkerOptions.workerSrc = blobUrl`. This is more complex than the simple CDN URL approach of v1/v2, but it works reliably on servers that misconfigure `.mjs` MIME types.

### DOCX Parsing: mammoth.js

mammoth extracts plain text from `.docx` files, preserving paragraph structure. It's well-maintained, handles edge cases gracefully, and has no native dependencies. For Clippy's use case (read the text, don't render the formatting), it's perfect.

### State Management: React `useState` only

No Redux. No Zustand. No Context API for global state.

Clippy has one page and a linear wizard. The entire app state fits in a single `AppState` object managed by a single `useState` hook. Keeping state co-located in `Home.tsx` makes the reset flow trivial (one `setState` call), makes debugging straightforward (one place to look), and eliminates the boilerplate tax of global state libraries.

### Encryption: Web Crypto API (AES-GCM)

The OpenRouter API key is sensitive. Storing it in plain text in React state is safe from persistence (it's in the heap, not localStorage), but a careless `console.log(state)` or a state inspector would expose it.

Clippy uses `window.crypto.subtle` to encrypt the key with AES-GCM 256-bit as soon as the user clicks "Lock". A random 12-byte IV is generated per encryption. The encrypted blob is stored in state; the raw key is cleared. Before each model API call, the blob is decrypted just-in-time.

The CryptoKey itself is never exported or serialized — it lives in the JS heap and is destroyed on tab close. This means the encrypted blob can't be decrypted in a new session. That's intentional: the key is session-scoped.

### AI: OpenRouter API (direct browser → API)

OpenRouter is a unified gateway to 100+ models. One API key, one endpoint (`https://openrouter.ai/api/v1/chat/completions`), and you can call Claude, GPT, Gemini, Mistral, Llama, and DeepSeek with identical request format.

All calls go directly from the user's browser to OpenRouter — no Clippy proxy server. This keeps the architecture zero-backend but means the API key must be provided by the user.

**Important:** OpenRouter model IDs go stale. `claude-3.5-sonnet`, `gpt-4o`, `gemini-pro-1.5`, `llama-3.1-70b-instruct`, `mistral-large` all returned "No endpoints found" when Clippy v3.1.x was being tested. The model list must be validated against the live [OpenRouter models endpoint](https://openrouter.ai/api/v1/models) periodically.

**Also important:** `response_format: { type: "json_object" }` is an OpenAI extension. Sending it to Anthropic, Google, Mistral, Meta, or DeepSeek models causes errors. Clippy gates this on a `JSON_MODE_MODELS` whitelist of model ID prefixes.

### Export: jsPDF (text-based PDF)

For PDF export, `jsPDF`'s text/table API is used rather than `html2canvas`. The trade-off:
- **Pro:** searchable, copyable text; small file size (50–200KB vs 1–5MB for screenshots); works offline
- **Con:** doesn't look exactly like the UI

For a legal analysis report, content matters more than pixel-perfect aesthetics. The PDF includes a cover page, per-model sections with trust score badges, dimension progress bars, and flagged clause cards — all drawn with jsPDF primitives.

### Share: base64 JSON in URL hash

Share URLs encode the full analysis results as `btoa(encodeURIComponent(JSON.stringify(payload)))` in the URL fragment. No server required. The payload includes file name, timestamp, prompt titles, and all model results — but never the API key.

This approach has a practical limit: very large analyses (8 models × many flags) can generate URLs that exceed browser limits (~2MB). For typical contracts (2–5 models, 5–15 flags each), the URLs are well within limits.

### Hosting: SiteGround (nginx) via FTP

The production site at [clippy.legal](https://clippy.legal) runs on SiteGround shared hosting. The build output (`dist/public/`) is deployed via FTP using Python's `ftplib.FTP_TLS`. Because SiteGround's caching layer can be aggressive, `index.html` is uploaded with `Cache-Control: no-cache` headers via `.htaccess`, and asset files are content-hashed by Vite.

---

## How Analysis Works

```
User uploads PDF/DOCX/TXT
        │
        ▼
fileParser.ts extracts plain text
(pdfjs-dist blob-URL worker for PDF; mammoth for DOCX; File.text() for TXT)
        │
        ▼
Home.tsx assembles the request
  - assemblePromptInstructions(enabledPrompts) → system instruction block
  - model IDs from selectedModels[]
        │
        ▼
Promise.allSettled([analyzeWithModel(model1), analyzeWithModel(model2), ...])
        │
  ┌─────┴──────────────────────────────────┐
  │ openrouter.ts per model:               │
  │  - decryptKey(apiKeyEncrypted)         │
  │  - AbortController(120s timeout)       │
  │  - POST /v1/chat/completions           │
  │  - response_format only for OpenAI     │
  │  - JSON.parse + schema validation      │
  │  - populate ModelResult               │
  └─────┬──────────────────────────────────┘
        │
        ▼
Results dashboard renders:
  TrustScoreRing + summary + flags + dimensions
  Export (PDF/MD) · Share URL · Per-model tabs
```

---

## War Stories

These are the real bugs that were fixed between v1.0.0 and v3.2.3. Each one taught something.

### 1. The MIME Type from Hell (v3.0.x → v3.1.0)

**Problem:** PDF upload worked locally but threw a `TypeError: Failed to construct 'Worker'` on the live site. Took an embarrassingly long time to diagnose.

**Root cause:** pdfjs-dist v5 switched its worker from a `.js` file to a `.mjs` (ES module) file. SiteGround's nginx configuration serves `.mjs` files with `Content-Type: application/octet-stream`. Browsers refuse to load a Worker from a non-JavaScript MIME type — security policy.

The CDN worker URL that worked fine in v1 (`cdnjs.cloudflare.com/ajax/libs/pdf.js/...`) was version 4.9.155, while the installed package was v5.6.205. When we switched to the bundled worker URL, nginx served it wrong.

**Fix:** Fetch the `.mjs` worker file, re-wrap it as a `text/javascript` Blob, and register the blob URL with `GlobalWorkerOptions.workerSrc`. The browser sees a correctly-typed worker regardless of what the server says.

```typescript
const workerResponse = await fetch(workerUrl);
const workerText = await workerResponse.text();
const blob = new Blob([workerText], { type: "text/javascript" });
GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
```

Also added `AddType text/javascript .mjs` to `.htaccess` as a belt-and-suspenders fix.

**Lesson:** When using a file parsing library that spawns a Worker, always verify the MIME type your server serves for that worker file. Nginx doesn't know about `.mjs` by default.

---

### 2. Model IDs Go Stale (v3.1.x → v3.2.0)

**Problem:** Multiple models returned `"No endpoints found"` after v3.1.0 launched. Users reported failures for Claude, GPT-4o, Gemini, and Mistral.

**Root cause:** OpenRouter renames model IDs as providers release new versions. The IDs hard-coded in v3.1.0 (`claude-3.5-sonnet`, `gpt-4o`, `gemini-pro-1.5`, `mistral-large`, `llama-3.1-70b-instruct`) had all been superseded.

**Fix:** Audited every model ID against the live [OpenRouter models endpoint](https://openrouter.ai/api/v1/models) and updated to:

| Old (broken) | New (working) |
|---|---|
| `anthropic/claude-3.5-sonnet` | `anthropic/claude-3.7-sonnet` |
| `openai/gpt-4o` | `openai/gpt-4.1` |
| `openai/gpt-4o-mini` | `openai/gpt-4.1-mini` |
| `google/gemini-pro-1.5` | `google/gemini-2.5-pro` |
| `mistralai/mistral-large` | `mistralai/mistral-large-2512` |
| `meta-llama/llama-3.1-70b-instruct` | `meta-llama/llama-3.3-70b-instruct` |

**Lesson:** Never hard-code OpenRouter model IDs and assume they're permanent. The model list should be reviewed every major version.

---

### 3. `response_format` Is OpenAI-Only (v3.1.x → v3.2.0)

**Problem:** After fixing model IDs, analysis still failed for Claude, Gemini, Mistral, Llama, and DeepSeek with cryptic API errors.

**Root cause:** The code was sending `response_format: { type: "json_object" }` to every model. This is an OpenAI-specific extension. Anthropic, Google, Mistral, Meta, and DeepSeek don't support it — sending it causes their APIs to return an error.

**Fix:** Added a `JSON_MODE_MODELS` set of OpenAI model ID prefixes. The `response_format` field is only included in the request body when the model ID starts with `openai/`. All other models receive a prompt instruction to output JSON instead.

**Lesson:** Read the docs for every model provider before assuming OpenAI API extensions are universal. The OpenAI Chat Completions API has become a de facto standard, but extensions like `response_format`, `tools`, and `logprobs` are not universally supported.

---

### 4. No Timeout = Infinite Hang (v3.1.x → v3.2.1)

**Problem:** Some model cards would show "Reading…" forever. No error, no timeout, no feedback.

**Root cause:** `fetch()` has no built-in timeout. If OpenRouter accepted the request but the upstream model was overloaded or slow, the response could take arbitrarily long. The card would just spin.

**Fix:** Added an `AbortController` with a 120-second timeout to every model fetch. If the request takes longer than 120 seconds, the AbortController fires, the request is cancelled, and the model card shows a timeout error.

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 120_000);
try {
  const response = await fetch(url, { signal: controller.signal, ... });
} finally {
  clearTimeout(timeout);
}
```

**Lesson:** Always set a timeout on fetch calls that talk to external AI APIs. Models can queue requests indefinitely. A user staring at a spinner for 3 minutes with no feedback will just close the tab.

---

### 5. Browser Cached `index.html` (v3.1.x)

**Problem:** After deploying a new version, users would still see the old app. Hard refresh fixed it. The problem reproduced consistently on all browsers.

**Root cause:** Vite content-hashes JS and CSS bundles (e.g. `index-a3f8c21b.js`) so those files cache correctly forever. But `index.html` itself has no hash — it's always `index.html`. Without `Cache-Control` headers on `index.html`, browsers cache it for hours, meaning they keep requesting the old JS bundles that no longer exist on the server.

**Fix:** Added `Cache-Control: no-cache, no-store, must-revalidate` to `index.html` via both the HTML `<meta>` tag and `.htaccess`. The JS/CSS bundles themselves get long `max-age` cache headers because their filenames change when the content changes.

**Lesson:** When deploying a Vite/React app to a static host, you need two caching policies: `no-cache` for `index.html` and `immutable` (or long max-age) for the content-hashed assets. Most deployment platforms (Vercel, Netlify) handle this automatically. FTP to shared hosting does not.

---

### 6. `?lang=` URL Parameter Was Ignored (v3.1.x)

**Problem:** Sharing a link like `https://clippy.legal?lang=fr` would show the English UI. The URL parameter was being completely ignored.

**Root cause:** The `detectLocale()` function in `i18n.ts` checked only `localStorage` and `navigator.language`. It never looked at the URL `?lang=` parameter.

**Fix:** Updated `detectLocale()` to check URL parameters first (highest priority), then `localStorage`, then `navigator.language`, then fall back to English. This also makes it easy to share locale-specific links.

**Priority order:**
1. `?lang=XX` URL parameter
2. `localStorage["clippy-locale"]`
3. `navigator.language` (browser default)
4. `"en"` fallback

**Lesson:** When building an i18n system from scratch, URL parameters should always be the highest-priority locale signal. They're the only way to override locale programmatically — useful for testing, for share links, and for marketing campaigns targeting specific regions.

---

### 7. claude-sonnet-4.6 Was Just Slow (v3.2.1 → v3.2.2)

**Problem:** Users reported that Claude analysis would get stuck even with the 120s timeout in place. Investigation showed the request was completing — just taking 20–35 seconds for a typical contract, which felt broken to users who were used to GPT finishing in 4–6 seconds.

**Root cause:** Not a bug. `claude-sonnet-4.6` (later `anthropic/claude-sonnet-4-6` on OpenRouter) was genuinely slow at the time of testing — possibly due to demand on the OpenRouter endpoint or the model itself.

**Fix:** Swapped the default Anthropic model from `claude-sonnet-4.6` to `claude-3.7-sonnet`. The latter consistently returns results in 3–8 seconds on the same contracts. The timeout was also raised from 90s to 120s to accommodate slow moments.

**Lesson:** Model speed is not guaranteed and varies by OpenRouter endpoint availability. Having a timeout and a fallback model are both important. Also: always test with real contracts, not just a short "test" paragraph.

---

### 8. Error Messages Were Always Wrong (v3.0.x)

**Problem:** When a PDF upload failed (e.g. because the file was password-protected), the UI would show "Incorrect password". Users found this confusing because they hadn't entered a password.

**Root cause:** The catch block in the file parser always showed the same error message ("password error") regardless of what actually went wrong.

**Fix:** Changed the catch block to read `err.message` and route to the appropriate user-facing error string: password errors show the password message; other errors show a generic parse failure message.

**Lesson:** Never show a generic error message in a catch block without first reading the actual error. AI-adjacent apps have many failure modes; users need accurate feedback to understand what went wrong and what to try next.

---

## Project Structure

```
clippy/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ClippyCharacter.tsx   # Animated SVG paperclip mascot
│   │   │   ├── LanguageSwitcher.tsx  # 17-locale dropdown in the nav bar
│   │   │   └── TrustScoreRing.tsx    # Animated SVG progress ring (0–100)
│   │   ├── lib/
│   │   │   ├── encryption.ts         # AES-GCM 256-bit API key encryption
│   │   │   ├── export.ts             # PDF and Markdown report generation
│   │   │   ├── fileParser.ts         # PDF/DOCX/TXT extraction (pdfjs + mammoth)
│   │   │   ├── i18n.ts               # Custom zero-dependency i18n, 17 locales
│   │   │   ├── openrouter.ts         # OpenRouter API client + model registry
│   │   │   ├── prompts.ts            # Curated prompt library (10 objectives)
│   │   │   └── share.ts              # Base64 URL encode/decode for sharing
│   │   └── pages/
│   │       ├── Home.tsx              # Main wizard page (3-step flow, ~1500 lines)
│   │       └── ShareView.tsx         # Read-only shared result viewer
│   └── public/
│       └── .htaccess                 # MIME types (.mjs) + cache headers
├── shared/
│   └── schema.ts                     # Shared TypeScript types
├── CHANGELOG.md
├── CONTRIBUTING.md
├── INSTALL.md
├── SECURITY.md
└── README.md
```

---

## Models

The current model list (v3.2.3):

| Model | Provider | Default | JSON Mode |
|---|---|---|---|
| `anthropic/claude-3.7-sonnet` | Anthropic | ✅ #1 | Prompt-only |
| `anthropic/claude-3.5-haiku` | Anthropic | — | Prompt-only |
| `openai/gpt-4.1` | OpenAI | ✅ #2 | `response_format` |
| `openai/gpt-4.1-mini` | OpenAI | — | `response_format` |
| `google/gemini-2.5-pro` | Google | — | Prompt-only |
| `mistralai/mistral-large-2512` | Mistral | — | Prompt-only |
| `meta-llama/llama-3.3-70b-instruct` | Meta | — | Prompt-only |
| `deepseek/deepseek-r1` | DeepSeek | — | Prompt-only |

"JSON Mode" refers to whether `response_format: { type: "json_object" }` is sent in the API request. OpenAI models support this natively. All other models receive a prompt instruction to output valid JSON instead.

---

## Cost Estimates

With OpenRouter's pay-per-call pricing (as of April 2026):

| Contract length | 2 models | 4 models | 8 models |
|---|---|---|---|
| Short (5 pages) | ~$0.01–0.03 | ~$0.02–0.06 | ~$0.05–0.15 |
| Medium (20 pages) | ~$0.05–0.15 | ~$0.10–0.30 | ~$0.20–0.60 |
| Long (50+ pages) | ~$0.15–0.50 | ~$0.30–1.00 | ~$0.60–2.00 |

Gemini 2.5 Pro and GPT-4.1 are at the more expensive end; Haiku, Llama, and Mistral are cheapest. Prices vary. Check [openrouter.ai/models](https://openrouter.ai/models) for current pricing.

---

## Privacy Model

1. **Your contract never leaves your browser to a Clippy server.** The file is parsed entirely client-side. Clippy has no backend infrastructure.
2. **The OpenRouter API key is encrypted.** It is held in React state as a plain string only during initial input. After locking, it is encrypted via AES-GCM 256-bit (Web Crypto API) and the plain text is cleared. It is decrypted just-in-time before each API call.
3. **No analytics, no tracking, no cookies.**
4. **Contract text is sent to OpenRouter** (and from there to the selected model provider) as part of the AI request. That is inherent to how LLM analysis works. Do not analyze confidential contracts with NDAs that prohibit this — or use a self-hosted model.
5. **Share URLs encode results in the URL fragment.** The fragment is never sent to any server (browsers strip it from HTTP requests). The recipient's browser decodes it locally.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/paulfxyz/clippy.git
cd clippy

# 2. Install
npm install

# 3. Start dev server
npm run dev
# → http://localhost:5000
```

You need an [OpenRouter API key](https://openrouter.ai/keys) to run analyses. The key is entered in the app UI — not in `.env` or config files.

See [INSTALL.md](./INSTALL.md) for production deployment guides (FTP, Cloudflare Pages, Vercel, Netlify, GitHub Pages, Docker).

---

## Supported File Formats

| Format | Parser | Notes |
|---|---|---|
| `.pdf` | pdfjs-dist v5 | Machine-readable PDFs only. Scanned image-only PDFs return empty text. Password-protected PDFs are not supported. |
| `.docx` | mammoth.js | Word documents. Preserves paragraph structure. |
| `.txt` | Native `File.text()` | Plain text. |
| `.md` | Native `File.text()` | Markdown. Read as plain text. |

---

## Running in Other Languages

The UI auto-detects your browser locale. To force a specific language, add `?lang=XX` to the URL:

```
https://clippy.legal?lang=fr   → French
https://clippy.legal?lang=es   → Spanish
https://clippy.legal?lang=de   → German
https://clippy.legal?lang=ja   → Japanese
https://clippy.legal?lang=ar   → Arabic (RTL)
```

Supported locales: `en`, `fr`, `es`, `pt`, `de`, `nl`, `it`, `zh`, `ru`, `hi`, `bg`, `pl`, `da`, `ja`, `ko`, `he`, `ar`.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The fastest contribution is adding a new OpenRouter model — 5 minutes of work, immediate value for all users.

---

## License

MIT — see [LICENSE](./LICENSE).

---

*Built by [Paul Fleury](https://github.com/paulfxyz). If Clippy helped you catch a bad contract clause, give the repo a ⭐ — it's the best motivation to keep building.*
