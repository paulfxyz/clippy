# Changelog

All notable changes to Clippy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [Unreleased]

### Planned for v1.1.0
- Dark mode toggle in header
- Keyboard shortcut to trigger analysis (⌘↵ / Ctrl+↵)
- Improved mobile layout for results dashboard
- Model cost estimator shown during model selection

### Planned for v1.2.0
- Export results as formatted PDF report
- Printable view

### Planned for v1.3.0
- Side-by-side diff view between two model results

---

[1.0.0]: https://github.com/paulfxyz/clippy/releases/tag/v1.0.0
[Unreleased]: https://github.com/paulfxyz/clippy/compare/v1.0.0...HEAD
