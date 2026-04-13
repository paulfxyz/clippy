# 📎 Clippy — AI Contract Analyzer

<div align="center">

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║    📎  C L I P P Y                                           ║
║        AI Contract Analyzer                                   ║
║                                                               ║
║    "It looks like you're signing a contract.                 ║
║     Would you like help checking for nasty clauses?"         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

[![Version](https://img.shields.io/badge/version-2.0.0-F5D000?style=flat-square&labelColor=1a1a2e)](https://github.com/paulfxyz/clippy/releases/tag/v2.0.0)
[![License: MIT](https://img.shields.io/badge/license-MIT-000000?style=flat-square)](https://github.com/paulfxyz/clippy/blob/main/LICENSE)
[![Built with React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white&labelColor=20232a)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-API-7c3aed?style=flat-square)](https://openrouter.ai)
[![Zero Backend](https://img.shields.io/badge/backend-zero-22c55e?style=flat-square)](https://clippy.legal)
[![Status](https://img.shields.io/badge/status-live-22c55e?style=flat-square)](https://clippy.legal)

**Open-source, browser-only AI contract analyzer.**  
Multi-model. Zero storage. No server. Just truth.

[Live App](https://clippy.legal) · [GitHub](https://github.com/paulfxyz/clippy) · [Report Bug](https://github.com/paulfxyz/clippy/issues) · [Request Feature](https://github.com/paulfxyz/clippy/issues)

</div>

---

## What is Clippy?

Clippy is an **open-source alternative to [small-print.ai](https://small-print.ai/)** — a tool that lets you upload any contract (PDF, DOCX, TXT, Markdown) and have multiple AI models simultaneously analyze it for risky, abusive, or deceptive clauses.

The key difference: **Clippy runs entirely in your browser.** Your contract text is sent directly from your browser to [OpenRouter](https://openrouter.ai), using your own API key. No file ever touches a third-party server. No data is stored. No account required.

### Why it exists

Legal contracts are designed to be long, dense, and deliberately confusing. Lawyers are expensive. Most people sign contracts without reading them — or read them without fully understanding the implications. Clippy bridges that gap by putting state-of-the-art AI models to work on your behalf, for free (minus the cost of OpenRouter API calls, which are tiny).

### The mascot

Clippy is named after [Microsoft's Office Assistant](https://en.wikipedia.org/wiki/Office_Assistant) — the animated paperclip introduced in Microsoft Office 97. Love it or hate it, Clippy was trying to help. So is this one. The design pays homage to the original: golden paperclip body, expressive eyes, speech bubble. The same energy, a very different mission.

---

## What's New in v2.0.0

Version 2.0.0 is a major feature release, transforming Clippy from a basic one-shot analyzer into a full-featured contract intelligence platform.

### 3-Step Wizard Flow

The app now guides you through a structured 3-step process:

| Step | Name | What happens |
|------|------|-------------|
| 1 | **Setup** | Upload contract + enter API key (with encryption) + select models |
| 2 | **Objectives** | Choose what to analyze from the curated prompt library, customize or add your own |
| 3 | **Results** | Live parallel analysis, results dashboard, export & share |

### Modular Prompt Library (Step 2)

The biggest new feature. Instead of a single freeform "custom instructions" box, v2 ships with a **curated library of 10 analysis objectives** across 5 categories:

| Category | Objectives |
|----------|------------|
| **General** | Unfair & Abusive Clauses, Termination & Exit Rights, Governing Law & Jurisdiction |
| **Financial** | Pricing & Payment Risks, Liability & Indemnification |
| **Privacy** | Data Privacy & GDPR, Monitoring & Surveillance |
| **Employment** | Non-Compete & Restrictive Covenants, IP Assignment (Employment) |
| **IP** | IP & Licensing Rights |

Users can:
- **Toggle** individual objectives on/off
- **Edit** any prompt inline (change the title, description, or instruction text)
- **Add** unlimited custom objectives with free-form text
- **Delete** their custom objectives

All enabled prompts are assembled into a single instruction block and prepended to the contract text before each model call. This is far more powerful than the v1 "add custom instructions" text box.

### AES-GCM API Key Encryption

In v1, the API key was held in plain React state (as a string). In v2, the key is **encrypted client-side using browser-native AES-GCM** (256-bit, via `window.crypto.subtle`) the moment you click "Lock". The raw key is replaced in state with an encrypted blob. The key is only decrypted just-in-time before each model API call.

This is defence-in-depth: it prevents the raw key from being trivially visible in React DevTools state, and demonstrates that the key is treated with care. The encryption is session-scoped (the AES key is generated once on first use, lives in the JS heap for the tab lifetime, and is never exported or stored).

Note: This is NOT protection against a malicious browser extension (which can read JS heap memory). It is NOT protection against XSS. The goal is user trust signalling and basic defence-in-depth, not cryptographic secrecy against a capable adversary. See `client/src/lib/encryption.ts` for the full technical rationale.

### PDF and Markdown Export

From the results dashboard, you can now download the analysis:

- **PDF**: A formatted multi-page report with trust score badge, per-model sections, dimension bars, and a full flags list with severity color coding. Generated using jsPDF — text-based, searchable, copy-pasteable.
- **Markdown**: A GitHub-compatible `.md` file with the same information formatted as headers, tables, and blockquotes. Zero external dependencies — built from string concatenation and a Blob URL.

Both exports are entirely client-side. No server roundtrip.

### Shareable Result URLs

After analysis, click "Share URL" to generate a shareable link. The link encodes all results directly in the URL hash fragment:

```
https://clippy.legal/#/share/BASE64_ENCODED_JSON
```

Anyone with the link can view the results in a read-only mode — no API key, no server, no account. The URL is self-contained: the payload is the base64-encoded JSON of the `SharePayload` schema, which includes the results but explicitly excludes the API key.

The ShareView page (`ShareView.tsx`) decodes the hash, validates the schema, and renders the results dashboard in read-only mode.

### Duration Tracking

Each model now reports how long its API call took (wall-clock time from request to parsed response), shown in the results dashboard. Useful for comparing model speed and for debugging slow responses.

---

## Features

### Core (v1 + v2)
- **Multi-model analysis** — Run 8+ AI models simultaneously (Claude, GPT-4o, Gemini, Mistral, Llama, DeepSeek, and more)
- **Parallel execution** — All selected models run at the same time, not sequentially
- **Trust Score** — A 0–100 score representing overall contract fairness, with a visual animated ring
- **5 Dimensions** — Transparency, Balance, Legal Compliance, Financial Risk, Exit Freedom — each scored independently
- **Severity flags** — CRITICAL, SUSPECT, MINOR — each flag includes a title, explanation, and a verbatim quote from the contract
- **Model comparison** — Results are shown per-model in tabs, so you can compare what Claude found vs. what GPT-4o found
- **Jurisdiction detection** — Models attempt to identify the applicable legal jurisdiction

### New in v2.0.0
- **3-step wizard** — Structured flow: Setup → Objectives → Results
- **Prompt library** — 10 curated analysis objectives across 5 categories (General, Financial, Privacy, Employment, IP)
- **Prompt customization** — Toggle, edit, and add objectives inline
- **AES-GCM key encryption** — API key is encrypted in-browser before being stored in state
- **PDF export** — Formatted multi-page report via jsPDF
- **Markdown export** — GitHub-compatible `.md` report
- **Share URLs** — Base64-encoded results in URL hash fragment, rendered by ShareView page
- **Duration tracking** — Wall-clock API call time per model, shown in results

### Privacy & architecture
- **Zero backend** — The Express server included in this repo is a thin dev scaffold. The core app is 100% static
- **No file storage** — Contract text lives in React state, never written to disk or database
- **No analytics** — No tracking, no cookies, no session logging
- **Your API key, your costs** — OpenRouter API key is entered at runtime, never stored (not localStorage, not cookies)
- **Client-side extraction** — PDF parsing via `pdf.js`, DOCX parsing via `mammoth` — both run in the browser, no server upload

### Supported file formats
| Format | Library | Notes |
|--------|---------|-------|
| `.pdf` | `pdfjs-dist` | All text layers extracted per-page |
| `.docx` | `mammoth` | Raw text extraction, ignores styles |
| `.txt` | Native `File.text()` | Direct UTF-8 read |
| `.md` | Native `File.text()` | Treated as plain text |

---

## Supported Models (via OpenRouter)

| Model | Provider | Context | Notes |
|-------|----------|---------|-------|
| Claude 3.5 Sonnet | Anthropic | 200k | Best for nuanced legal reasoning |
| Claude 3 Haiku | Anthropic | 200k | Fast and affordable |
| GPT-4o | OpenAI | 128k | Excellent general analysis |
| GPT-4o Mini | OpenAI | 128k | Fast, cost-effective |
| Gemini Pro 1.5 | Google | 1M | Long context, great at documents |
| Mistral Large | Mistral AI | 128k | Strong EU legal context |
| Llama 3.1 70B Instruct | Meta | 128k | Open-source powerhouse |
| DeepSeek R1 | DeepSeek | 64k | Strong reasoning model |

All models are accessed through [OpenRouter](https://openrouter.ai), which normalizes the API across providers. You can add any OpenRouter-supported model by updating `client/src/lib/openrouter.ts`.

---

## Quick Start

### Prerequisites
- Node.js >= 18
- An [OpenRouter API key](https://openrouter.ai/keys) (free to create, pay per token)

### Running locally

```bash
# Clone the repository
git clone https://github.com/paulfxyz/clippy.git
cd clippy

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5000`.

No environment variables required. The OpenRouter API key is entered in the UI at runtime.

### Building for production (static deploy)

```bash
npm run build
```

This outputs to `dist/public/`. The result is a completely static site — just HTML, CSS, and JavaScript. No server required. Deploy to any static host: Cloudflare Pages, Vercel, Netlify, GitHub Pages, an S3 bucket, or any FTP server.

See [INSTALL.md](./INSTALL.md) for full deployment instructions including SiteGround FTP, Fly.io, and Cloudflare Pages.

---

## Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (User)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React App (Vite + TypeScript)            │   │
│  │                                                       │   │
│  │  Step 1: Setup                                        │   │
│  │    ├── File Upload → pdf.js / mammoth → plain text    │   │
│  │    ├── API Key → AES-GCM encrypt → state blob         │   │
│  │    └── Model Selection → selectedModels[]             │   │
│  │                                                       │   │
│  │  Step 2: Objectives                                   │   │
│  │    ├── Toggle/edit 10 built-in prompts               │   │
│  │    └── Add custom objectives                          │   │
│  │                                                       │   │
│  │  Step 3: Results                                      │   │
│  │    ├── Decrypt API key (AES-GCM)                      │   │
│  │    ├── assemblePromptInstructions(prompts[])           │   │
│  │    ├── fetch() × N models (parallel)                  │   │
│  │    │         │                                        │   │
│  │    │         ▼                                        │   │
│  │    │   OpenRouter API ──► Claude                      │   │
│  │    │   (direct from    ──► GPT-4o                     │   │
│  │    │    browser)       ──► Gemini                     │   │
│  │    │                   ──► ...                        │   │
│  │    │                                                   │   │
│  │    ├── Trust Score + Dimensions + Flags               │   │
│  │    ├── Export as PDF / Markdown                       │   │
│  │    └── Generate shareable URL                        │   │
│  │                                                       │   │
│  │  ShareView (/share/:payload)                          │   │
│  │    └── base64 decode → render read-only results       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Why no backend?

The Express server in this repo (`server/`) is a **development scaffold** only — it serves the Vite dev server in development mode. In production, the build output is a purely static bundle.

All AI calls go directly from the user's browser to `https://openrouter.ai/api/v1/chat/completions`. The OpenRouter CORS policy allows this. This design means:

1. **Zero infrastructure cost** — no server to maintain, no database, no scaling concerns
2. **Zero data liability** — we literally cannot store your contract because we never receive it
3. **Transparent cost model** — users pay OpenRouter directly for their own API usage

### API Key security model

The API key lifecycle in v2:

```
User types key in <input>
         │
         ▼
encryptKey(rawKey)   — AES-GCM 256-bit, browser crypto.subtle
         │
         ▼
apiKeyEncrypted  ←  stored in React state (base64 blob)
rawKey           ←  cleared from state immediately

... later, at analysis time ...

decryptKey(apiKeyEncrypted)  →  rawKey (passed to fetch, not stored)
```

The raw key is never written to localStorage, sessionStorage, IndexedDB, cookies, or any server. It lives in React state for the briefest moment before being encrypted. This is defence-in-depth.

### Prompt assembly pipeline

```
DEFAULT_PROMPTS (prompts.ts)         ← 10 curated objectives
         │
         ├── User toggles on/off
         ├── User edits prompt text
         └── User adds custom objectives
         │
         ▼
assemblePromptInstructions(prompts[])
         │
         ▼  (example output)
"In addition to the general analysis, pay special attention to the following:

### Unfair & Abusive Clauses
Identify clauses that are heavily one-sided...

### Data Privacy & GDPR
Analyse all data privacy and personal data clauses..."
         │
         ▼
Prepended to contract text in user message → OpenRouter API
```

### Share URL encoding

```
SharePayload (JSON)
    ├── version: "2.0.0"
    ├── fileName: "contract.pdf"
    ├── analyzedAt: "2025-04-14T..."
    ├── prompts: ["Unfair & Abusive Clauses", ...]
    └── results: [{ modelId, trustScore, flags, ... }]
         │
         ▼
JSON.stringify  →  encodeURIComponent  →  btoa (base64)
         │
         ▼
https://clippy.legal/#/share/BASE64_HERE

(ShareView.tsx decodes: atob → decodeURIComponent → JSON.parse)
```

The API key is explicitly **never included** in the SharePayload. Share URLs are intended to be public.

### File extraction pipeline

```
User drops file
     │
     ▼
extractTextFromFile(file)  —  client/src/lib/fileParser.ts
     │
     ├── .pdf  ──► pdfjs-dist.getDocument() → iterate pages → getTextContent() → join strings
     │                (pdf.js worker loaded from cdnjs CDN to avoid bundling the 2MB worker)
     │
     ├── .docx ──► mammoth.extractRawText({ arrayBuffer }) → .value
     │
     └── .txt/.md ──► File.text() (native Web API)
     │
     ▼
string stored in React state (fileText)
     │
     ▼
Sent in OpenRouter API body as user message content
```

### State machine (v2)

The app uses a single `AppState` object with a `step` discriminator:

```typescript
type AppStep = "setup" | "prompts" | "results";

// setup → prompts → results
//   ↑____________________|  (reset button)
```

Navigation is forward-only through the wizard, with the "New Analysis" header button resetting to `"setup"`.

### Model results lifecycle

```typescript
// Initial state when analysis starts
{ modelId, modelName, status: "loading", ... }

// On success (fires as each parallel request completes)
{ modelId, modelName, status: "done", trustScore, summary, flags, dimensions, durationMs }

// On error
{ modelId, modelName, status: "error", error: "human-readable message" }
```

Results are stored in a `ModelResult[]` array. Each model's `Promise` updates its own entry using `setState` with a functional update. This avoids race conditions when multiple models complete simultaneously.

---

## Under the Hood

### Prompt library design

The 10 built-in prompts are designed around three principles:

1. **Specificity** — each prompt tells the model exactly what to look for, not just "analyze this area". This produces actionable flags rather than generic summaries.
2. **Additivity** — prompts stack without contradicting each other. General prompts run alongside Financial + Privacy simultaneously.
3. **Calibrated defaults** — the 3 General prompts are enabled by default because they apply to virtually all contract types. Specialized prompts (GDPR, IP, employment) are opt-in.

### JSON mode and fallback parsing

OpenRouter forwards `response_format: { type: "json_object" }` to models that support it (GPT-4o, GPT-4o Mini). For models that don't (Llama, Mistral, etc.), JSON mode is ignored. The fallback in `analyzeWithModel()`:

```typescript
const cleaned = content
  .replace(/^```json?\n?/, "")   // strip opening code fence
  .replace(/\n?```$/, "")        // strip closing code fence
  .trim();
parsed = JSON.parse(cleaned);
```

This handles the common pattern where models wrap their JSON output in a markdown code block even when you ask them not to.

### Temperature at 0.1

Contract analysis benefits from very low temperature. We want deterministic legal assessment, not creative interpretation. `temperature: 0.1` gives consistent results while leaving just enough flexibility for the model to adapt its phrasing naturally.

### jsPDF export strategy

The PDF export uses jsPDF's text/table API rather than html2canvas screenshot because:
- Screenshots capture screen-resolution artifacts (CSS shadows, pixel offsets)
- jsPDF text is searchable, copy-pasteable, and accessible
- Smaller file size (typically 50–200KB vs 1–5MB for screenshots)
- Works offline — no browser paint cycle needed

The trade-off is that the PDF looks different from the UI — this is acceptable for a report export where content > aesthetics.

### Share URL length considerations

A typical 2–3 model analysis SharePayload JSON is ~5–15KB. After `encodeURIComponent` + `btoa`, the base64 string is ~7–20KB. Modern browsers support URL lengths up to 2MB in most contexts. However, some email clients and URL shorteners may truncate at ~2000 characters. If you're sharing results from a long multi-model analysis, prefer copy-pasting the URL directly rather than embedding in email.

We deliberately chose NOT to use GZIP compression (pako/LZ-string) because:
- The added dependency is not worth it for typical payload sizes
- The encoding/decoding logic is simpler without it
- If needed, compression can be added as a transparent layer in the future

### pdfjs-dist worker strategy

`pdf.js` requires a separate Web Worker for the actual PDF parsing. We load the worker from a CDN (`cdnjs.cloudflare.com`) rather than bundling it. This keeps the main bundle small — the worker is ~400KB and is only loaded when a PDF is actually dropped. The trade-off is a one-time network request for PDF users.

### Trust Score color thresholds

| Score | Color | Label |
|-------|-------|-------|
| 75–100 | Green (#22c55e) | Fair |
| 50–74 | Yellow (#eab308) | Caution |
| 30–49 | Orange (#f97316) | Risky |
| 0–29 | Red (#ef4444) | Abusive |

These thresholds are calibrated against typical contract analysis outputs from Claude and GPT-4o during development. A "100" would be an unusually fair, balanced, plain-language contract. Most real-world contracts land in the 55–75 range.

### Clippy SVG character

The Clippy mascot is a hand-crafted SVG — no external image, no WebP, no PNG. The paperclip body is drawn with two overlapping `<path>` elements (outer stroke in `#C8A800` for shadow, inner stroke in `#F5D000` for the bright body). Eyes are `<ellipse>` elements that animate via React state (blinking is achieved by setting `ry` to `0.8` on a 3-second randomized interval). The speech bubble is a `<div>` with CSS triangle tails. Everything is inline SVG — zero HTTP requests.

---

## Project Structure

```
clippy/
├── client/                          # Frontend React application
│   ├── index.html                   # Vite entry point + font preloads + favicon
│   └── src/
│       ├── App.tsx                  # Root component, router (/, /share/:payload)
│       ├── index.css                # Global styles, CSS variables, animations
│       ├── components/
│       │   ├── ClippyCharacter.tsx  # Animated paperclip SVG mascot
│       │   └── TrustScoreRing.tsx   # Animated SVG ring for trust score
│       ├── lib/
│       │   ├── openrouter.ts        # OpenRouter API client, model registry, system prompt
│       │   ├── fileParser.ts        # Client-side file text extraction (PDF/DOCX/TXT)
│       │   ├── encryption.ts        # AES-GCM browser-native API key encryption
│       │   ├── prompts.ts           # Curated prompt library (10 objectives, 5 categories)
│       │   ├── export.ts            # PDF (jsPDF) + Markdown download
│       │   ├── share.ts             # URL hash encode/decode for SharePayload
│       │   ├── queryClient.ts       # TanStack Query config
│       │   └── utils.ts             # Tailwind merge utility
│       └── pages/
│           ├── Home.tsx             # Main 3-step wizard (Setup → Objectives → Results)
│           ├── ShareView.tsx        # Read-only shared results viewer
│           └── not-found.tsx        # 404 page
├── server/                          # Dev scaffold only (not used in production)
│   ├── index.ts                     # Express + Vite dev server setup
│   ├── routes.ts                    # Health check route
│   ├── storage.ts                   # No-op storage interface
│   └── vite.ts                      # Vite middleware for dev
├── shared/
│   └── schema.ts                    # TypeScript types shared between client and server
│                                    # v2: AnalysisPrompt, AppState, SharePayload, AppStep
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── README.md
├── INSTALL.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

---

## Adding a New Model

1. Open `client/src/lib/openrouter.ts`
2. Add an entry to the `AVAILABLE_MODELS` array:

```typescript
{
  id: "provider/model-name",    // OpenRouter model ID
  name: "Display Name",         // Shown in UI
  provider: "Provider Name",    // Provider label
  description: "Short desc",    // Tooltip text
  icon: "P",                    // Single letter avatar
}
```

3. That's it. The model will appear in the model selection grid.

Find model IDs at [openrouter.ai/models](https://openrouter.ai/models).

---

## Customizing Analysis Objectives

### Editing the built-in library

The prompt library is defined in `client/src/lib/prompts.ts` as the `DEFAULT_PROMPTS` array. Each prompt has:

```typescript
{
  id: "unique-id",
  title: "Short display title",
  description: "One-line description shown to users",
  prompt: `The actual instruction text sent to the model...`,
  category: "general" | "privacy" | "financial" | "employment" | "ip" | "custom",
  enabled: boolean,    // true = on by default
  isDefault: boolean,  // true = part of the shipped library
  isCustom: boolean,   // true = user-created (can be deleted)
}
```

### Adding prompts programmatically

```typescript
import { DEFAULT_PROMPTS } from "@/lib/prompts";

// Add a new built-in objective
DEFAULT_PROMPTS.push({
  id: "general-data-portability",
  title: "Data Portability",
  description: "Check if you can export your data when you leave.",
  prompt: `Examine all data portability and export clauses...`,
  category: "general",
  enabled: false,
  isDefault: true,
  isCustom: false,
});
```

### Modifying the core system prompt

The core instruction set (JSON format, severity definitions, 5 dimensions) is in `client/src/lib/openrouter.ts` as the `SYSTEM_PROMPT` constant. If you add new JSON output fields, update the `ModelResult` type in `shared/schema.ts` accordingly.

---

## Cost Estimates

These are approximate costs for a typical 5,000-word contract analyzed by a single model:

| Model | Input tokens (~7k) | Output tokens (~1k) | Estimated cost |
|-------|-------------------|--------------------|----------------|
| Claude 3 Haiku | $0.00084 | $0.00125 | ~$0.002 |
| GPT-4o Mini | $0.00105 | $0.00060 | ~$0.002 |
| Claude 3.5 Sonnet | $0.02100 | $0.01500 | ~$0.035 |
| GPT-4o | $0.01750 | $0.01000 | ~$0.028 |
| Gemini Pro 1.5 | $0.00525 | $0.00250 | ~$0.008 |

Running all 8 models on a 5,000-word contract costs roughly **$0.10–0.15** total. For the two fastest/cheapest models (Haiku + GPT-4o Mini), the cost is under $0.01.

Note: Adding more analysis objectives (prompts) in Step 2 increases the input token count, which increases costs proportionally. The 3 default General prompts add roughly 200–400 tokens per analysis.

---

## Roadmap

### Done (v2.0.0)
- [x] 3-step wizard flow (Setup → Objectives → Results)
- [x] Modular prompt library with toggle/edit/add
- [x] AES-GCM API key encryption
- [x] PDF export (jsPDF)
- [x] Markdown export
- [x] Shareable URL (base64 hash fragment)
- [x] Duration tracking per model

### Planned
- [ ] **v2.1.0** — Side-by-side diff view between model results
- [ ] **v2.2.0** — Clause-by-clause highlighting (highlight contract text matching each flag)
- [ ] **v2.3.0** — Template library (pre-configured prompt sets for SaaS, employment, real estate)
- [ ] **v3.0.0** — Optional self-hosted backend with persistent analysis history

---

## Self-Hosting

Clippy is designed to be trivially self-hostable. After `npm run build`, the `dist/public/` folder is a static site. Deploy it anywhere:

- **Cloudflare Pages** — Free, global CDN, automatic deploys from GitHub
- **Vercel** — One-click deploy, free tier
- **Netlify** — Drag and drop the `dist/public/` folder
- **Any FTP server** — Upload the `dist/public/` contents to your webroot
- **GitHub Pages** — Push `dist/public/` to a `gh-pages` branch

See [INSTALL.md](./INSTALL.md) for step-by-step guides for each deployment target.

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Areas where help is especially useful:
- Adding more OpenRouter model presets
- Improving the prompt library for specific contract types
- Translations of the UI
- Accessibility improvements
- Testing with edge-case contracts (different languages, unusual formats)

---

## Security

Found a security issue? See [SECURITY.md](./SECURITY.md) for responsible disclosure.

Note: Since Clippy runs entirely client-side and doesn't store any data, the attack surface is minimal. The main security consideration is ensuring the OpenRouter API key is never persisted in ways that can be read by other scripts. In v2, the key is AES-GCM encrypted in browser memory — see `client/src/lib/encryption.ts` for details and honest caveats.

---

## License

MIT — see [LICENSE](./LICENSE).

Fork it. Hack it. Make it better. That's the point.

---

## Credits

- Inspired by [small-print.ai](https://small-print.ai/) — the concept, not the code
- Namesake: [Clippy the Office Assistant](https://en.wikipedia.org/wiki/Office_Assistant), Microsoft Office 97–2003
- AI routing: [OpenRouter](https://openrouter.ai)
- PDF parsing: [pdf.js](https://mozilla.github.io/pdf.js/) by Mozilla
- DOCX parsing: [mammoth.js](https://github.com/mwilliamson/mammoth.js) by Mike Williamson
- PDF export: [jsPDF](https://github.com/parallax/jsPDF)
- UI: [React](https://react.dev) + [Vite](https://vitejs.dev) + [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)

---

<div align="center">

Built by [paulfxyz](https://github.com/paulfxyz) · MIT License · [clippy.legal](https://clippy.legal)

*"It looks like you're signing a contract. Would you like help checking for nasty clauses?"*

</div>
