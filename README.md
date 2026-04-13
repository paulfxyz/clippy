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

[![Version](https://img.shields.io/badge/version-1.0.0-F5D000?style=flat-square&labelColor=1a1a2e)](https://github.com/paulfxyz/clippy/releases/tag/v1.0.0)
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

## Features

### Core
- **Multi-model analysis** — Run 8+ AI models simultaneously (Claude, GPT-4o, Gemini, Mistral, Llama, DeepSeek, and more)
- **Parallel execution** — All selected models run at the same time, not sequentially
- **Trust Score** — A 0–100 score representing overall contract fairness, with a visual animated ring
- **5 Dimensions** — Transparency, Balance, Legal Compliance, Financial Risk, Exit Freedom — each scored independently
- **Severity flags** — CRITICAL, SUSPECT, MINOR — each flag includes a title, explanation, and a verbatim quote from the contract
- **Model comparison** — Results are shown per-model in tabs, so you can compare what Claude found vs. what GPT-4o found
- **Custom instructions** — Append your own prompt (e.g. "focus on GDPR compliance" or "flag non-compete clauses")
- **Jurisdiction detection** — Models attempt to identify the applicable legal jurisdiction

### Privacy & architecture
- **Zero backend** — The Express server included in this repo is a thin dev scaffold. The core app is 100% static
- **No file storage** — Contract text lives in React state, never written to disk or database
- **No analytics** — No tracking, no cookies, no session logging
- **Your API key, your costs** — OpenRouter API key is entered at runtime, never stored anywhere (not localStorage, not cookies — see the Architecture section for why)
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
┌─────────────────────────────────────────────────┐
│                  Browser (User)                  │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │          React App (Vite + TS)            │   │
│  │                                           │   │
│  │  Step 1: File Upload                      │   │
│  │    └── pdf.js / mammoth → plain text      │   │
│  │                                           │   │
│  │  Step 2: Config                           │   │
│  │    └── API key + model selection          │   │
│  │                                           │   │
│  │  Step 3: Analysis                         │   │
│  │    └── fetch() × N models (parallel)      │   │
│  │         │                                 │   │
│  │         ▼                                 │   │
│  │    OpenRouter API ──► Claude              │   │
│  │    (direct from    ──► GPT-4o             │   │
│  │     browser)       ──► Gemini             │   │
│  │                    ──► ...                │   │
│  │                                           │   │
│  │  Step 4: Results Dashboard                │   │
│  │    └── Trust Score + Dimensions + Flags   │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Why no backend?

The Express server in this repo (`server/`) is a **development scaffold** only — it serves the Vite dev server in development mode. In production, the build output is a purely static bundle.

All AI calls go directly from the user's browser to `https://openrouter.ai/api/v1/chat/completions`. The OpenRouter CORS policy allows this. This design means:

1. **Zero infrastructure cost** — no server to maintain, no database, no scaling concerns
2. **Zero data liability** — we literally cannot store your contract because we never receive it
3. **Transparent cost model** — users pay OpenRouter directly for their own API usage

### Why not localStorage for the API key?

The webapp template this project is based on explicitly prohibits `localStorage`, `sessionStorage`, `indexedDB`, and cookies because the sandboxed iframe environment blocks them. More importantly, storing an API key in `localStorage` is a security anti-pattern — any XSS vulnerability or browser extension can read it. Clippy keeps the API key in React component state (`useState`), which means it lives only in memory and is wiped on tab close or page refresh. This is intentional.

### The analysis prompt

The system prompt is defined in `client/src/lib/openrouter.ts` and instructs models to return a structured JSON object with:
- A `trustScore` (0–100)
- A `summary` (2–3 sentence plain-language assessment)
- A `jurisdiction` field (detected legal context)
- Five `dimensions` (Transparency, Balance, Legal Compliance, Financial Risk, Exit Freedom)
- An array of `flags` (each with severity, title, description, and a verbatim quote)

The prompt requests `response_format: { type: "json_object" }` for models that support it (OpenAI-compatible models). For models that don't, there's a fallback that strips markdown code fences from the response before JSON parsing.

### File extraction pipeline

```
User drops file
     │
     ▼
extractTextFromFile(file) — client/src/lib/fileParser.ts
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

### State machine

The app has four discrete steps managed by a single `step` string in React state:

```
"upload" → "config" → "analyzing" → "results"
```

There is no URL routing for steps (the hash router is only used for potential future pages like `/about`). Steps transition forward-only except for the "New Analysis" button which resets to `"upload"`.

### Model results lifecycle

```typescript
// Initial state when analysis starts
{ modelId, modelName, status: "loading", ... }

// On success
{ modelId, modelName, status: "done", trustScore, summary, flags, dimensions }

// On error
{ modelId, modelName, status: "error", error: "message" }
```

Results are stored in a `ModelResult[]` array. Each model's `Promise` updates its own entry using `setState` with a functional update (`s => ({ ...s, results: s.results.map(...) })`). This avoids race conditions when multiple models complete simultaneously.

---

## Under the Hood

### JSON mode and fallback parsing

OpenRouter forwards `response_format` to models that support it (GPT-4o, GPT-4o Mini). For models that don't (Llama, Mistral, etc.), JSON mode is ignored. The fallback in `analyzeWithModel()`:

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

### pdfjs-dist worker strategy

`pdf.js` requires a separate Web Worker for the actual PDF parsing. We load the worker from a CDN (`cdnjs.cloudflare.com`) rather than bundling it. This keeps the main bundle small — the worker is ~400KB and is only loaded when a PDF is actually dropped. The trade-off is a one-time network request for PDF users.

### Trust Score color thresholds

| Score | Color | Label |
|-------|-------|-------|
| 75–100 | Green (#22c55e) | Fair |
| 50–74 | Yellow (#eab308) | Caution |
| 30–49 | Orange (#f97316) | Risky |
| 0–29 | Red (#ef4444) | Abusive |

These thresholds are somewhat arbitrary but calibrated against typical contract analysis outputs from Claude and GPT-4o during development. A "100" would be an unusually fair, balanced, plain-language contract. Most real-world contracts land in the 55–75 range.

### Clippy SVG character

The Clippy mascot is a hand-crafted SVG — no external image, no WebP, no PNG. The paperclip body is drawn with two overlapping `<path>` elements (outer stroke in `#C8A800` for shadow, inner stroke in `#F5D000` for the bright body). Eyes are `<ellipse>` elements that animate via React state (blinking is achieved by setting `ry` to `0.8` on a 3-second randomized interval). The speech bubble is a `<div>` with a pseudo-element triangle. Everything is inline SVG — zero HTTP requests.

---

## Project Structure

```
clippy/
├── client/                     # Frontend React application
│   ├── index.html              # Vite entry point + font preloads + favicon
│   └── src/
│       ├── App.tsx             # Root component, router setup
│       ├── index.css           # Global styles, CSS variables, animations
│       ├── components/
│       │   ├── ClippyCharacter.tsx   # The animated paperclip SVG mascot
│       │   └── TrustScoreRing.tsx    # Animated SVG ring for trust score
│       ├── lib/
│       │   ├── openrouter.ts   # OpenRouter API client + model registry + system prompt
│       │   ├── fileParser.ts   # Client-side file text extraction (PDF/DOCX/TXT)
│       │   ├── queryClient.ts  # TanStack Query config
│       │   └── utils.ts        # Tailwind merge utility
│       └── pages/
│           ├── Home.tsx        # Main app page (all 4 steps)
│           └── not-found.tsx   # 404 page
├── server/                     # Dev scaffold only (not used in production)
│   ├── index.ts                # Express + Vite dev server setup
│   ├── routes.ts               # Minimal health check route
│   ├── storage.ts              # No-op storage interface
│   └── vite.ts                 # Vite middleware for dev
├── shared/
│   └── schema.ts               # TypeScript types shared between client and server
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

## Customizing the System Prompt

The full system prompt is in `client/src/lib/openrouter.ts` as the `SYSTEM_PROMPT` constant. You can modify it to:
- Add new dimensions
- Change severity thresholds
- Focus on specific contract types (SaaS, employment, real estate, etc.)
- Add jurisdiction-specific rules
- Request additional output fields

If you add output fields, update the `ModelResult` type in `shared/schema.ts` accordingly.

---

## Cost Estimates

These are approximate costs for a typical 5,000-word contract analyzed by a single model:

| Model | Input tokens (~7k) | Output tokens (~1k) | Estimated cost |
|-------|-------------------|--------------------|----|
| Claude 3 Haiku | $0.00084 | $0.00125 | ~$0.002 |
| GPT-4o Mini | $0.00105 | $0.00060 | ~$0.002 |
| Claude 3.5 Sonnet | $0.02100 | $0.01500 | ~$0.035 |
| GPT-4o | $0.01750 | $0.01000 | ~$0.028 |
| Gemini Pro 1.5 | $0.00525 | $0.00250 | ~$0.008 |

Running all 8 models on a 5,000-word contract costs roughly **$0.10–0.15** total. For the two fastest/cheapest models (Haiku + GPT-4o Mini), the cost is under $0.01.

---

## Roadmap

- [ ] **v1.1.0** — Dark mode toggle in UI
- [ ] **v1.2.0** — Export results as PDF report
- [ ] **v1.3.0** — Side-by-side diff view between model results  
- [ ] **v1.4.0** — Clause-by-clause highlighting (highlight contract text matching each flag)
- [ ] **v1.5.0** — Saved sessions (opt-in, local only, encrypted)
- [ ] **v2.0.0** — Comparison mode: upload two contracts (before/after negotiation)
- [ ] **v2.1.0** — Template library (common contract types with pre-loaded custom prompts)
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
- Improving the system prompt for specific contract types
- Translations of the UI
- Accessibility improvements
- Testing with edge-case contracts (different languages, unusual formats)

---

## Security

Found a security issue? See [SECURITY.md](./SECURITY.md) for responsible disclosure.

Note: Since Clippy runs entirely client-side and doesn't store any data, the attack surface is minimal. The main security consideration is ensuring the OpenRouter API key is never persisted in ways that can be read by other scripts.

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
- UI: [React](https://react.dev) + [Vite](https://vitejs.dev) + [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)

---

<div align="center">

Built by [paulfxyz](https://github.com/paulfxyz) · MIT License · [clippy.legal](https://clippy.legal)

*"It looks like you're signing a contract. Would you like help checking for nasty clauses?"*

</div>
