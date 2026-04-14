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

[![Version](https://img.shields.io/badge/version-3.2.4-F5D000?style=flat-square&labelColor=1a1a2e)](https://github.com/paulfxyz/clippy/releases/tag/v3.2.4)
[![License: MIT](https://img.shields.io/badge/license-MIT-000000?style=flat-square)](https://github.com/paulfxyz/clippy/blob/main/LICENSE)
[![Built with React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white&labelColor=20232a)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-API-7c3aed?style=flat-square)](https://openrouter.ai)
[![Zero Backend](https://img.shields.io/badge/backend-zero-22c55e?style=flat-square)](https://clippy.legal)
[![Status](https://img.shields.io/badge/status-live-22c55e?style=flat-square)](https://clippy.legal)
[![i18n](https://img.shields.io/badge/i18n-20%20languages-F5D000?style=flat-square)](https://clippy.legal)

![Clippy — your contract analyst](https://clippy.legal/img/logo.jpg?v=2)

**Open-source, browser-only AI contract analyzer. Multi-model. Zero storage. No server. Just truth.**

[**Try it live →**](https://clippy.legal) · [Releases](https://github.com/paulfxyz/clippy/releases) · [Report Bug](https://github.com/paulfxyz/clippy/issues) · [CHANGELOG](./CHANGELOG.md) · [INSTALL](./INSTALL.md)

</div>

---

## Table of Contents

- [What Clippy Does](#what-clippy-does)
- [Screenshots](#screenshots)
- [Why It Exists](#why-it-exists)
- [The Mascot](#the-mascot)
- [Features](#features)
- [Quick Start](#quick-start)
- [Supported Models](#supported-models)
- [Tech Stack — Every Choice Explained](#tech-stack--every-choice-explained)
- [Architecture](#architecture)
- [The Legal Context](#the-legal-context)
  - [The Problem with Standard Form Contracts](#the-problem-with-standard-form-contracts)
  - [EU Law: Directive 93/13/EEC](#eu-law-directive-9313eec)
  - [GDPR — Regulation 2016/679](#gdpr--regulation-20162679)
  - [US Law: Unconscionability and Arbitration](#us-law-unconscionability-and-arbitration)
  - [UK Law: Consumer Rights Act 2015](#uk-law-consumer-rights-act-2015)
  - [French Consumer Law](#french-consumer-law)
  - [Arbitration Clauses: The Global Picture](#arbitration-clauses-the-global-picture)
  - [IP Assignment Clauses](#ip-assignment-clauses)
  - [Liability Caps and Indemnification](#liability-caps-and-indemnification)
  - [Governing Law and Forum Selection](#governing-law-and-forum-selection)
  - [The Small Print Problem](#the-small-print-problem)
  - [Limitations of AI Contract Analysis](#limitations-of-ai-contract-analysis)
- [Under the Hood](#under-the-hood)
  - [Analysis Dimensions](#analysis-dimensions)
  - [Severity Calibration](#severity-calibration)
  - [JSON Mode and Fallback Parsing](#json-mode-and-fallback-parsing)
  - [Temperature Strategy](#temperature-strategy)
  - [pdfjs-dist Worker Strategy](#pdfjs-dist-worker-strategy)
  - [Share URL Design](#share-url-design)
  - [Trust Score Thresholds](#trust-score-thresholds)
- [War Stories — Every Bug That Shaped This Project](#war-stories--every-bug-that-shaped-this-project)
- [Project Structure](#project-structure)
- [Adding a Model](#adding-a-model)
- [Customizing Analysis Objectives](#customizing-analysis-objectives)
- [Cost Estimates](#cost-estimates)
- [Roadmap](#roadmap)
- [Self-Hosting](#self-hosting)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Credits & References](#credits--references)
- [A Note on Vibe Coding and Human Leadership](#a-note-on-vibe-coding-and-human-leadership)

---

## What Clippy Does

Clippy lets you upload any contract — PDF, DOCX, TXT, or Markdown — and have multiple AI models simultaneously analyze it for risky, abusive, or deceptive clauses. It runs entirely in your browser: your contract text is sent directly from your browser to [OpenRouter](https://openrouter.ai) using your own API key. No file ever touches a Clippy server. No data is stored. No account required.

You choose which AI models to run. You choose which analysis objectives matter — GDPR compliance? Non-compete enforceability? Hidden fees? Unlimited IP assignment? The models run in parallel. Results appear live. You can download a PDF or Markdown report, or generate a shareable URL that encodes the full results for a colleague.

For under $0.15, you get the same first-pass analysis that a paralegal would charge $150 for — instantaneous, parallel across 8 models, with specific clause quotation and severity tagging.

---

## Screenshots

![Step 1 — Upload your contract and configure models](https://clippy.legal/img/screenshot-step1.jpg)
*Step 1 — Upload your contract (PDF, DOCX, TXT), paste your OpenRouter key, select AI models*

![Step 2 — Choose analysis objectives](https://clippy.legal/img/screenshot-step2.jpg)
*Step 2 — Toggle analysis objectives: GDPR, non-compete, IP assignment, financial risk, and more*

![Step 3 — Results dashboard with trust score and flags](https://clippy.legal/img/screenshot-step3.jpg)
*Step 3 — Trust score, dimension breakdown, and annotated clause flags with severity ratings*

---

## Why It Exists

Legal contracts are designed to be long, dense, and deliberately hard to parse. Lawyers are expensive and unavailable to most people at the moment they need them most — which is when they're about to sign something. Most people sign contracts without reading them. Those who do often lack the legal background to identify what's actually dangerous vs. standard boilerplate.

Clippy bridges that gap. It doesn't replace a lawyer. It doesn't give legal advice. But it gives you, at almost zero cost, the same first-pass analysis a first-year associate would do: flag the clauses that look unusual, one-sided, or potentially abusive, and explain why in plain language.

The premise: **a single paragraph of a contract signed without understanding can cost you more than Clippy's entire development**. That's the product.

---

## The Mascot

Clippy is named after [Microsoft's Office Assistant](https://en.wikipedia.org/wiki/Office_Assistant) — the animated paperclip introduced in Microsoft Office 97. Love it or hate it, Clippy was trying to help. So is this one.

The design pays homage to the original: golden paperclip body, expressive eyes, a speech bubble. The same energy, a very different mission. The SVG is drawn entirely in code — no external image files, no HTTP requests. Three overlapping paths create the paperclip's 3D effect: a dark gold shadow layer, a bright yellow body, and a specular highlight. The eyes blink on a randomized 3–5 second interval so it never feels mechanical.

The name is also a small act of reclamation. Clippy was mocked into retirement in 2004. Here, it gets to be useful.

---

## Features

### Core
- **Multi-model analysis** — Run up to 8 AI models simultaneously (Claude, GPT, Gemini, Mistral, Llama, DeepSeek)
- **Parallel execution** — All selected models run concurrently via `Promise.allSettled()`, not sequentially
- **Trust Score** — A 0–100 score per model with animated ring visualization, color-coded by tier
- **5 analysis dimensions** — Transparency, Balance, Legal Compliance, Financial Risk, Exit Freedom — each scored 0–100
- **Severity-flagged clauses** — CRITICAL / SUSPECT / MINOR with title, description, and verbatim quote from the contract

### Prompt Library
- **10 curated objectives** across 5 categories: General (3), Financial (2), Privacy (2), Employment (2), IP (1)
- **All legally grounded** — each prompt cites specific EU Directives, GDPR Articles, US case law, UK Acts
- **Toggle / edit / add** — switch any objective on or off; edit the instructions; add custom objectives
- **Custom prompt creation** — "Add custom objective" creates a blank prompt in your session

### Privacy & Architecture
- **Zero backend** — no server, no database, no account, no logs
- **Files never leave your browser** — contract text is extracted client-side; only the text (not the file) goes to OpenRouter
- **AES-GCM API key encryption** — key is encrypted in browser memory (Web Crypto API) as soon as you lock it; decrypted just-in-time before each call
- **No analytics, no tracking, no cookies**

### Export & Share
- **PDF export** — jsPDF text-based report with cover page, trust score badges, dimension bars, flagged clause cards
- **Markdown export** — GitHub-compatible `.md` with ASCII progress bars and blockquoted clause quotes
- **Share URL** — full results encoded as base64 in the URL fragment; no server needed for sharing

### Supported File Formats
| Format | Parser | Notes |
|--------|--------|-------|
| `.pdf` | pdfjs-dist v5 | Machine-readable only. Password-protected PDFs not supported. Scanned (image-only) PDFs return empty text. |
| `.docx` | mammoth.js | Word documents. Preserves paragraph structure. |
| `.txt` | Native `File.text()` | Plain text. |
| `.md` | Native `File.text()` | Markdown. Read as plain text. |

### Internationalization
- **20 languages** — EN, FR, ES, PT, DE, NL, IT, ZH, RU, HI, BG, PL, DA, JA, KO, HE, AR, TR, SV, ID
- **RTL support** — Arabic and Hebrew render right-to-left with correct `dir="rtl"` on `<html>`
- **Locale detection priority** — `?lang=XX` URL param → `localStorage` → browser language → English fallback
- **Locale-aware AI output** — analysis results delivered in the active UI language
- **Demo modal** — "See Demo" hero slideshow translated in all 20 languages

---

## Quick Start

### Prerequisites

- Node.js 18+ / npm 9+
- An [OpenRouter API key](https://openrouter.ai/keys) (free to create; you pay per API call)

### Running Locally

```bash
git clone https://github.com/paulfxyz/clippy.git
cd clippy
npm install
npm run dev
# → http://localhost:5000
```

### Building for Production

```bash
npm run build
# Output: dist/public/ — fully self-contained static site
```

See [INSTALL.md](./INSTALL.md) for deployment guides: FTP, Cloudflare Pages, Vercel, Netlify, GitHub Pages, Docker.

### Running in a Specific Language

Add `?lang=XX` to the URL:
```
https://clippy.legal?lang=fr   → Français
https://clippy.legal?lang=tr   → Türkçe
https://clippy.legal?lang=ar   → العربية (RTL)
https://clippy.legal?lang=id   → Bahasa Indonesia
```

---

## Supported Models

Current model list (v3.2.4), via [OpenRouter](https://openrouter.ai):

| Model | Provider | Default | JSON Mode | Notes |
|-------|----------|---------|-----------|-------|
| `anthropic/claude-3.7-sonnet` | Anthropic | ✅ #1 | Prompt-only | Fast, excellent reasoning |
| `anthropic/claude-3.5-haiku` | Anthropic | — | Prompt-only | Cheapest Anthropic option |
| `openai/gpt-4.1` | OpenAI | ✅ #2 | `response_format` | Strong JSON compliance |
| `openai/gpt-4.1-mini` | OpenAI | — | `response_format` | Good value |
| `google/gemini-2.5-pro` | Google | — | Prompt-only | 1M context window |
| `mistralai/mistral-large-2512` | Mistral | — | Prompt-only | Strong EU legal context |
| `meta-llama/llama-3.3-70b-instruct` | Meta | — | Prompt-only | Open weights |
| `deepseek/deepseek-r1` | DeepSeek | — | Prompt-only | Chain-of-thought reasoning |

**JSON mode:** OpenAI models receive `response_format: { type: "json_object" }`. All other models receive a prompt instruction to output valid JSON. This is gated on a `JSON_MODE_MODELS` prefix whitelist in `openrouter.ts` — see [War Stories #3](#3-response_format-is-openai-only) for why.

**Model IDs go stale.** OpenRouter renames IDs as providers release new versions. The IDs above were verified against the live [OpenRouter models endpoint](https://openrouter.ai/api/v1/models) in April 2026. If a model returns "No endpoints found," check the live endpoint and update `AVAILABLE_MODELS` in `openrouter.ts`.

---

## Tech Stack — Every Choice Explained

### React 18 + TypeScript + Vite

React for the component-heavy wizard UI. TypeScript catches entire classes of bugs at compile time — especially important when passing complex nested objects (contract analysis results) through many component layers. Vite is fast enough that the feedback loop never gets in the way.

Content-hashed JS/CSS bundles mean CDN caches are invalidated automatically on each deploy. The one file without a hash is `index.html` — which caused a painful caching bug (see [War Stories #5](#5-browser-cached-indexhtml)).

### shadcn/ui + Tailwind CSS

shadcn/ui gives you accessible Radix UI primitives pre-wired with Tailwind. It's not a dependency you install — it's code you own, which means you can change anything without fighting a theming system.

The design uses a warm cream palette (`#F5EDD6`, `#F5D000`) instead of cold greys. Legal documents are stressful; the UI should feel like paper, not a dashboard.

### wouter with `useHashLocation`

Clippy needs client-side routing for `/share/:payload` but deploys as a static file. Path-based routing (`/share/...`) returns 404 from nginx without server configuration. Hash-based routing (`/#/share/...`) works on any server because the fragment is never sent to the server. `wouter` is 1.5KB and covers exactly this use case.

### pdfjs-dist v5

pdf.js by Mozilla is the gold standard for client-side PDF parsing. Version 5 moved to ES modules (`.mjs` workers), which introduced a serious deployment problem on SiteGround nginx (see [War Stories #1](#1-the-mime-type-from-hell)). The fix: fetch the worker, re-wrap as a `text/javascript` Blob, register via `GlobalWorkerOptions.workerSrc`.

### mammoth.js

Extracts plain text from `.docx` files with paragraph structure preserved. No native dependencies. For Clippy's use case — read the text, don't render the formatting — it's perfect.

### React `useState` only (no global state library)

No Redux. No Zustand. No Context for global state. Clippy has one page and a linear wizard. The entire app state fits in a single `AppState` object managed by one `useState` hook. Keeping state co-located in `Home.tsx` makes resets trivial (one `setState` call), debugging straightforward (one place to look), and eliminates the boilerplate tax of global state libraries.

### Web Crypto API (AES-GCM 256-bit)

The OpenRouter API key is sensitive. Clippy uses `window.crypto.subtle` to encrypt it with AES-GCM as soon as the user locks it. A random 12-byte IV is generated per encryption. The CryptoKey never leaves the JS heap — it's destroyed on tab close. The encrypted blob is stored in state; the raw key is cleared.

This is defence-in-depth against trivial key extraction — not against a capable browser-level adversary — and we're honest about that in the docs.

### OpenRouter (direct browser → API)

One API key, one endpoint (`https://openrouter.ai/api/v1/chat/completions`), 100+ models. All calls go directly from the browser to OpenRouter — no Clippy proxy. This keeps the architecture zero-backend.

### jsPDF (text-based PDF)

For PDF export, jsPDF's text/table API is used rather than html2canvas:
- Screenshots capture screen-resolution artifacts (CSS shadows, pixel offsets)
- jsPDF text is searchable, copyable, and accessible
- Smaller file size (50–200KB vs 1–5MB for screenshots)
- Works offline — no browser paint cycle needed

### Share: base64 JSON in URL hash

`btoa(encodeURIComponent(JSON.stringify(payload)))` in the URL fragment. No server required. The fragment is never sent to any server — browsers strip it from HTTP requests. The recipient's browser decodes it locally. API key never included.

### SiteGround (nginx) + FTP

Production at [clippy.legal](https://clippy.legal) runs on SiteGround shared hosting, deployed via Python `ftplib.FTP_TLS`. `index.html` gets `Cache-Control: no-cache`; content-hashed assets get long max-age.

---

## Architecture

### How Analysis Works

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
Promise.allSettled([analyzeWithModel(m1), analyzeWithModel(m2), ...])
        │
  ┌─────┴──────────────────────────────────────┐
  │ openrouter.ts — per model:                 │
  │  - decryptKey(apiKeyEncrypted)             │
  │  - AbortController (120s timeout)          │
  │  - POST /v1/chat/completions               │
  │  - response_format only for OpenAI models  │
  │  - JSON.parse + schema validation          │
  │  - ModelResult { status: "done" | "error" }│
  └─────┬──────────────────────────────────────┘
        │
        ▼
Results dashboard:
  TrustScoreRing + Summary + Dimensions + Flagged Clauses
  Per-model tabs · Export (PDF/MD) · Share URL
```

### Why No Backend?

The decision to have zero server-side infrastructure was deliberate:

1. **Privacy**: The most common legitimate objection to using an AI contract analyzer is "I don't want my contract stored on someone's server." With Clippy, there is no server. The promise is verifiable — the source code is public.

2. **Cost**: A backend adds infrastructure costs, maintenance burden, and operational complexity. For a free, open-source tool, those costs don't scale.

3. **Trust**: Every server is a potential attack surface. A contract often contains sensitive personal and business information. Removing the server removes the surface.

4. **Speed**: Direct browser-to-OpenRouter calls are faster than browser → Clippy proxy → OpenRouter.

The trade-off: users must provide their own API key. That's a friction point, but it's the honest trade.

### API Key Security Model

```
User types key
      │
      ▼ (on "Lock")
encryptKey(plaintext)
  ├── crypto.subtle.generateKey(AES-GCM 256) → sessionKey (in JS heap, never exported)
  ├── crypto.subtle.encrypt({ name: "AES-GCM", iv: random12bytes }, sessionKey, plaintext)
  └── base64(iv + ciphertext + authTag) → apiKeyEncrypted (stored in state)

Before each API call:
      │
      ▼
decryptKey(apiKeyEncrypted)
  ├── parse iv + ciphertext from base64
  ├── crypto.subtle.decrypt({ name: "AES-GCM", iv }, sessionKey, ciphertext)
  └── raw key string (used for this request only, then GC'd)
```

The AES CryptoKey lives only in the JavaScript heap. It is never exported, never serialized, and is wiped when the tab closes. The encrypted blob in state is useless without the session key. This means: the key is protected against casual inspection (DevTools `copy(state)`, browser extensions logging React state), but not against a sophisticated in-process attack that can access the JS heap directly.

### Prompt Assembly Pipeline

```typescript
// Step 2: user has toggled objectives
const enabled = prompts.filter(p => p.enabled);

// In openrouter.ts:
function assemblePromptInstructions(prompts: AnalysisPrompt[]): string {
  return enabled.map((p, i) =>
    `## Objective ${i+1}: ${p.title}\n${p.prompt}`
  ).join("\n\n");
}

// Sent as part of the system prompt:
SYSTEM_PROMPT + "\n\n" + assembledInstructions + "\n\n## Contract Text\n" + contractText
```

### State Machine

```typescript
type AppStep = "setup" | "prompts" | "results";
```

Three steps, one discriminant. When `step === "results"`, the results array starts with all models in `{ status: "loading" }` and updates live as each `analyzeWithModel()` Promise resolves or rejects. The `Promise.allSettled()` wrapper ensures one model's failure never blocks the others.

```typescript
// Initial state when analysis starts
{ modelId, modelName, status: "loading" }

// On success
{ modelId, modelName, status: "done", trustScore, summary, flags, dimensions, durationMs }

// On error (does not block other models)
{ modelId, modelName, status: "error", error: "human-readable message" }
```

---

## The Legal Context

This section is the legal background behind every analysis objective Clippy ships. Understanding the law helps you interpret the flags.

### The Problem with Standard Form Contracts

Most contracts you'll encounter in daily life are **contracts of adhesion** (*contrats d'adhésion*) — pre-drafted by the stronger party, presented on a take-it-or-leave-it basis, with no possibility of negotiation. Courts across the world have long struggled with how to protect consumers and weaker parties.

The core tension is between two principles:

1. **Freedom of contract** (*pacta sunt servanda*) — parties who freely agree to terms should be bound by them
2. **Substantive fairness** — courts should not enforce unconscionable or abusive contracts

The EU leans heavily toward consumer protection. The US leans toward freedom of contract with important carve-outs. Understanding which law applies to your contract is why Clippy's "Governing Law & Jurisdiction" prompt exists.

### EU Law: Directive 93/13/EEC

**Council Directive 93/13/EEC** of 5 April 1993 on unfair terms in consumer contracts is the foundational EU framework. It applies across all 27 member states and has been implemented into national law (France's *Code de la consommation* Art. L. 212-1, Germany's *BGB* §§ 307–309, Spain's *LGDCU*).

**Key provisions:**
- **Art. 3(1)** — An unfair term causes "a significant imbalance in the parties' rights and obligations, to the detriment of the consumer"
- **Art. 5** — Terms must be in **plain, intelligible language**. Ambiguous terms interpreted in the consumer's favour (*contra proferentem*)
- **Art. 6(1)** — Unfair terms are **not binding on the consumer**; the rest of the contract survives
- **Annex (Grey List)** — Terms that may be unfair include: unilateral modification rights; giving the seller exclusive right to interpret the contract; excluding liability for death or personal injury; auto-extending contracts with short opt-out windows; disproportionate compensation requirements

**Key CJEU jurisprudence:**
- **Océano Grupo Editorial v. Murciano Quintero (C-240/98)** — Courts can examine unfairness of their own motion. Consumers don't have to raise it themselves.
- **Aziz v. Caixa d'Estalvis (C-415/11)** — Clarified the "significant imbalance" test: would the consumer have agreed to this in individual negotiation? If not, it's unfair.
- **RWE Vertrieb v. Verbraucherzentrale (C-92/11)** — Unilateral price variation clauses without transparent mechanism held unfair.

When Clippy fires a CRITICAL flag on a unilateral modification clause, it is flagging something EU law has repeatedly held unfair under 93/13/EEC.

### GDPR — Regulation 2016/679

The **General Data Protection Regulation** (25 May 2018) applies to any organisation processing personal data of EU residents. It has influenced CCPA (California), LGPD (Brazil), PDPB (India), and dozens of other national laws.

**Key Articles for contract review:**

| Article | Topic | What to check |
|---------|-------|---------------|
| **Art. 5** | Principles | Data collected for specified, explicit purposes; not processed beyond those; stored no longer than necessary |
| **Art. 6** | Lawful basis | Processing must have a lawful basis — consent, contract performance, legitimate interest, legal obligation. Claiming "legitimate interest" for everything is a red flag |
| **Art. 7** | Consent | Must be freely given, specific, informed, unambiguous. Pre-ticked boxes are not consent |
| **Art. 13/14** | Transparency | What data, what purposes, what rights, what retention — all must be disclosed at collection |
| **Art. 17** | Right to erasure | The "right to be forgotten" — data subjects can request deletion in defined circumstances |
| **Art. 20** | Data portability | Right to receive personal data in machine-readable format and transfer it elsewhere |
| **Art. 28** | Processor obligations | If you're contracting with a data processor, a Data Processing Agreement (DPA) is legally required |
| **Art. 44–49** | Transfers outside EU | Standard Contractual Clauses (SCCs) required for data transfers to non-adequate third countries |

### US Law: Unconscionability and Arbitration

US contract law has no single federal equivalent to EU Directive 93/13/EEC. Protection comes from:

**1. The Unconscionability Doctrine (UCC § 2-302, Restatement Second § 208)**

A clause may be void if it has both:
- **Procedural unconscionability** — oppressive circumstances at formation (surprise, unequal bargaining power, no meaningful choice)
- **Substantive unconscionability** — oppressively one-sided terms

Courts weigh these together. California courts are more willing to void terms; New York applies unconscionability sparingly.

**2. Mandatory Arbitration and the FAA (9 U.S.C. § 1 et seq.)**

The FAA strongly favours enforcement of arbitration agreements. Landmark SCOTUS decisions:
- **AT&T Mobility v. Concepcion (2011)** — FAA preempts state laws invalidating class arbitration waivers. This effectively enabled companies to eliminate collective consumer redress via class-action waivers in arbitration clauses.
- **American Express v. Italian Colors (2013)** — Even where individual arbitration costs exceed potential recovery, class arbitration waivers are enforceable.
- **Viking River Cruises v. Moriana (2022)** — Limited PAGA (California's Private AG Act) in the arbitration context.

A mandatory arbitration clause with a class-action waiver in a US consumer contract can eliminate your practical ability to pursue small-value claims. Clippy flags these CRITICAL.

**3. Non-Compete Enforceability by Jurisdiction**

| Jurisdiction | Enforceability | Key Rule |
|---|---|---|
| **California** | Near-total ban | Cal. Bus. & Prof. Code § 16600 — void as matter of public policy |
| **Minnesota** | Banned since 2023 | Minn. Stat. § 181.988 |
| **North Dakota** | Banned | ND Cent. Code § 9-08-06 |
| **Florida** | Strongly enforced | Presumption in favour of enforcement; courts may rewrite |
| **New York** | Moderate | "Reasonable" test — time, geography, scope, legitimate interest |
| **UK** | Reasonable test | Must protect a legitimate interest; no wider than necessary |
| **France** | Must be compensated | Requires compensation during restriction period (*Cass. Soc., 10 juillet 2002*) |

**Federal FTC rule (2024):** The FTC issued a final rule seeking to ban most non-competes for workers — facing immediate legal challenges; status should be verified against current law.

### UK Law: Consumer Rights Act 2015

**Consumer Rights Act 2015 (CRA):**
- **s.62** — A term is unfair if it causes a significant imbalance in parties' rights and obligations, to the consumer's detriment, contrary to good faith
- **s.64** — Core terms exempt from fairness assessment if **transparent and prominent**
- **s.65** — Traders cannot exclude liability for death or personal injury caused by negligence. Period.
- **s.67** — Unfair term not binding; rest of contract survives
- **Schedule 2** — Grey list of potentially unfair terms

**Unfair Contract Terms Act 1977 (UCTA)** — Still applies to B2B contracts. Section 11 sets a "reasonableness" test for exclusion clauses.

**Key cases:**
- **OFT v. Abbey National [2009] UKSC 6** — Bank charges were "core terms" and exempt from fairness test
- **Director General v. First National Bank [2001] UKHL 52** — "Significant imbalance" assessed over the overall contractual position

### French Consumer Law

France has some of the world's most protective consumer contract law, built on the *Code de la consommation*:

**Loi Châtel (2008):**
- Art. L. 215-1 — Suppliers with annual auto-renewal must notify consumers of their right to opt out 1–3 months before the deadline. If not notified, consumer may terminate at any time.

**Loi Hamon (2014):**
- Extended cooling-off periods (14 days for most distance contracts)
- Strengthened prohibition on *clauses abusives* under Art. L. 212-1

**Clauses abusives (abusive clauses):**
- **Art. L. 212-1** — A clause creating a "significant imbalance" to the consumer's detriment is abusive
- **Décret n° 2009-302** — Lists presumed abusive clauses (rebuttable) and a "black list" of clauses that are always abusive (e.g., excluding liability for bodily injury)
- **Commission des clauses abusives (CCA)** — Issues influential sector-specific recommendations

### Arbitration Clauses: The Global Picture

What makes an arbitration clause problematic:
1. **Mandatory** — no choice but to arbitrate
2. **Class-action waiver** — cannot join others with the same claim
3. **Inconvenient seat** — arbitration far from the consumer's location
4. **Cost allocation** — consumer bears filing fees ($1,500+)
5. **Confidentiality** — results are secret, preventing public accountability

**EU position:** Mandatory pre-dispute arbitration in consumer contracts is generally unfair under 93/13/EEC — it deprives consumers of court access guaranteed by Art. 47 of the EU Charter. CJEU repeatedly confirmed courts must examine arbitration clauses of their own motion.

**US position:** Post-*Concepcion*, mandatory arbitration + class waiver is generally enforceable. Notable exceptions: sexual harassment claims (Ending Forced Arbitration Act, 2022); some federal statutory claims.

**UK position:** Consumer Rights Act 2015 s.91 renders arbitration clauses unfair where the consumer must arbitrate claims below £5,000 without preserving the right to court.

### IP Assignment Clauses

**UK:** Under Patents Act 1977 (s.39) and CDPA 1988 (s.11), work created by an employee in the course of employment vests in the employer. "Course of employment" is narrowly construed — personal time, personal equipment, unrelated topic is generally not employer property.

**US:** The "work made for hire" doctrine (17 U.S.C. § 101) is extremely broad for employees. But many contracts go further — assigning all inventions, including personal ones. California Labor Code § 2870 provides a carve-out: employers cannot require assignment of inventions developed entirely on personal time, without employer equipment or trade secrets, unrelated to the employer's business. Several other states have similar provisions.

**France:** Copyright vests originally in the author (the employee) under the *Code de la Propriété Intellectuelle*. Specific written assignments are required. *Droit moral* (moral rights) cannot be waived — they are inalienable under French law.

**What Clippy flags:** Blanket "assign all inventions" clauses with no carve-outs for personal work; waivers of moral rights; post-employment invention clauses ("any invention created for 1 year after termination"); absence of specific compensation for IP assignment beyond base salary.

### Liability Caps and Indemnification

**Typical limitation structure:**
```
Total liability shall not exceed fees paid in the 12 months preceding the claim.
EXCEPT FOR: death/personal injury · fraud · wilful misconduct · IP infringement ·
            data breach · indemnification obligations
```

The carve-outs are where the exposure lives. A $1,000 cap with a carve-out for "any breach of IP warranties" is nearly illusory if you face third-party infringement claims.

**Indemnification red flags:**
- **Broad triggers:** "any claim arising from or relating to your use" = effectively unlimited
- **Defense control:** If the indemnifying party controls defense, they may settle on terms that bind you
- **IP indemnification gaps:** If a SaaS vendor's software infringes a patent and you get sued, are you covered?
- **User content indemnification:** Platforms requiring users to indemnify for any claims from user content

**EU rules:** Directive 93/13/EEC Annex items (a) and (b) prohibit excluding/limiting liability for death or personal injury — these are in the "black list" and automatically unfair.

### Governing Law and Forum Selection

**EU Rome I Regulation (593/2008):** For consumer contracts, the chosen law cannot strip away protections from the mandatory rules of the consumer's country. An American company's ToS saying "governed by Delaware law" cannot deprive an EU consumer of rights under Directive 93/13/EEC and GDPR.

**Brussels I Recast (1215/2012):** For consumer contracts, the consumer may sue in courts of their own member state regardless of any exclusive jurisdiction clause.

**US approach:** Courts generally enforce forum selection clauses (*The Bremen v. Zapata*, 407 U.S. 1 (1972)), even for consumers. California has been reluctant to enforce outbound forum selection against California consumers.

**"Mandatory arbitration in San Francisco"** — common in US tech ToS. For a user in France or Indonesia, pursuing a $200 claim means flying to California for arbitration under California law. In practice, this eliminates consumer recourse entirely.

**What Clippy looks for:** Jurisdiction clauses requiring dispute resolution in an inconvenient location; exclusive jurisdiction in the vendor's home courts; class-action waivers; choice-of-law clauses potentially stripping EU statutory protections.

### The Small Print Problem

**Cognitive overload:** The average Terms of Service document is 7,000–10,000 words. Reading every ToS you encounter would require approximately 76 working days per year. No one reads them. This is rational, not lazy.

**Information asymmetry:** The drafting party employs lawyers who have optimised the contract over years of litigation. The signing party has no legal background and no time. This structural imbalance is why courts developed unconscionability, *contra proferentem*, and unfair terms legislation.

**Contract length as strategy:** Research suggests longer contracts increase the probability that problematic clauses go unnoticed. Placing a class-action waiver in paragraph 47 of a 50-page ToS is not accidental.

**AI as a leveller:** For under $0.15, you get the first-pass review a paralegal would charge $150 for — instantaneous, parallel across 8 models, with specific clause quotation and severity tagging. That's the core proposition of Clippy.

### Limitations of AI Contract Analysis

**What Clippy does well:**
- Identifying structurally unusual or one-sided clauses
- Flagging clauses matching known patterns of abuse (mandatory arbitration, auto-renewal, unlimited indemnification)
- Summarising the overall risk profile of a contract
- Running the same analysis across multiple models for second and third opinions

**What Clippy cannot do:**
- Provide legal advice — it is not a lawyer, and for significant contracts you should consult one
- Assess context — a non-compete that's abusive for a junior employee may be reasonable for a C-suite executive
- Know the latest case law — models have training cutoffs
- Analyse scanned PDFs — text must be machine-readable
- Guarantee completeness — AI can miss clauses; human review remains essential for high-stakes agreements

**Threat model:**
- Contract text is sent to OpenRouter and then to the AI provider. Treat this as "read by the provider's infrastructure." Do not analyze contracts containing national security secrets, privileged attorney-client communications, or highly sensitive third-party data.
- API key is encrypted in browser memory (AES-GCM). It is not stored to disk, never sent to Clippy infrastructure, sent to OpenRouter over TLS. This is defence-in-depth against casual inspection — not against a capable browser-level adversary.
- Share URLs encode results in the URL fragment (base64). The analysis results, including flagged clause quotes, become public if you share the URL.

---

## Under the Hood

### Analysis Dimensions

Five dimensions score each contract on a 0–100 scale:

| Dimension | What it measures | Low score means |
|-----------|-----------------|-----------------|
| **Transparency** | Are terms in plain language? Are limitations clearly disclosed? | Dense legalese, buried definitions, obligations hidden in cross-references |
| **Balance** | Are rights and obligations roughly symmetrical? | One party has broad unilateral rights; the other has few or none |
| **Legal Compliance** | Does the contract conform to applicable law? | Terms violating GDPR, consumer protection law, or employment law |
| **Financial Risk** | Are financial obligations clear and proportionate? | Hidden fees, unlimited indemnification, disproportionate penalties |
| **Exit Freedom** | How easily can the weaker party exit? | Long notice periods, heavy termination fees, obligations surviving termination |

### Severity Calibration

| Severity | Legal threshold | Example |
|----------|----------------|---------|
| **CRITICAL** | Clause likely unlawful, clearly abusive, or severely harmful | Mandatory arbitration + class waiver; GDPR Art. 6 lawful basis missing; auto-renewal with no cancellation right; unlimited liability exposure |
| **SUSPECT** | Unusual, one-sided, or potentially enforceable but outside market norms | 90-day notice period; non-compete with no compensation; arbitration in inconvenient city |
| **MINOR** | Worth noting but common and generally accepted | Standard limitation of liability; 30-day payment terms; governing law of vendor's home state |

### JSON Mode and Fallback Parsing

OpenAI models receive `response_format: { type: "json_object" }`. Other models receive a prompt instruction. The fallback parser handles the common case where models wrap JSON in a Markdown code fence:

```typescript
const cleaned = content
  .replace(/^```json?\n?/, "")   // strip opening code fence
  .replace(/\n?```$/, "")        // strip closing code fence
  .trim();
parsed = JSON.parse(cleaned);
```

### Temperature Strategy

Contract analysis benefits from very low temperature. `temperature: 0.1` gives consistent, deterministic legal assessment while leaving enough flexibility for the model to adapt phrasing naturally. Higher temperatures introduce creative but inaccurate interpretations of legal language.

### pdfjs-dist Worker Strategy

pdf.js v5 requires a Web Worker for PDF parsing. The worker file is `.mjs` — a format that SiteGround's nginx serves as `application/octet-stream` by default (browsers refuse to load Workers with non-JS MIME types). The fix:

```typescript
// Fetch the worker and re-wrap as a text/javascript Blob
const workerResponse = await fetch(workerUrl);
const workerText = await workerResponse.text();
const blob = new Blob([workerText], { type: "text/javascript" });
GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
```

`.htaccess` also has `AddType text/javascript .mjs` as a belt-and-suspenders fix for direct browser requests.

### Share URL Design

```
https://clippy.legal/#/share/BASE64_ENCODED_PAYLOAD
```

The payload is `btoa(encodeURIComponent(JSON.stringify(SharePayload)))`. It contains: fileName, analyzedAt, prompt titles, and all ModelResults — but never the API key. The `SharePayload.version` field is `"2.0.0"` — this is the payload format version, intentionally frozen. Changing it breaks all existing share links.

A typical 2–3 model analysis SharePayload is ~5–15KB raw JSON. After encoding, ~7–20KB. Modern browsers support URLs up to 2MB. Some email clients truncate at ~2000 chars — prefer direct copy-paste for sharing.

### Trust Score Thresholds

| Score | Color | Label |
|-------|-------|-------|
| 75–100 | Green (`#22c55e`) | Fair |
| 50–74 | Yellow (`#eab308`) | Caution |
| 30–49 | Orange (`#f97316`) | Risky |
| 0–29 | Red (`#ef4444`) | Abusive |

Calibrated against typical outputs from Claude and GPT-4.1 during development. Most real-world enterprise contracts land in the 55–75 range. A "100" would be an unusually fair, plain-language, balanced contract.

---

## War Stories — Every Bug That Shaped This Project

These are the real problems encountered between v1.0.0 and v3.2.4. Each one taught something worth documenting.

### 1. The MIME Type from Hell

**v3.0.x → v3.1.0 · PDF upload broken on production**

PDF upload worked locally but threw a `TypeError: Failed to construct 'Worker'` on the live site. No error in the console on first load. Took a long time to diagnose because the local environment never triggered it.

**Root cause:** pdfjs-dist v5 switched its worker file from `.js` to `.mjs` (ES module). SiteGround's nginx serves `.mjs` as `Content-Type: application/octet-stream`. Browsers refuse to load a Worker from a non-JavaScript MIME type — it's a security policy enforced at the platform level.

Additionally: the CDN worker URL used in v1 (`cdnjs.cloudflare.com/...`) was version 4.9.155, while the installed package was v5.6.205. The two were incompatible.

**Fix:** Fetch the `.mjs` worker file, re-wrap it as a `text/javascript` Blob, register the blob URL with `GlobalWorkerOptions.workerSrc`. The browser sees a correctly-typed Worker regardless of what the server says.

**Lesson:** When using a library that spawns a Worker, always verify the MIME type your server serves for that worker file. Nginx doesn't know about `.mjs` by default. Neither do many CDNs.

---

### 2. Model IDs Go Stale

**v3.1.x → v3.2.0 · "No endpoints found" across 6 models**

Multiple models returned `"No endpoints found"` immediately after v3.1.0 launched. Affected: Claude, GPT-4o, Gemini Pro 1.5, Mistral Large, Llama 3.1. Essentially all non-OpenAI models.

**Root cause:** OpenRouter renames model IDs as providers release new versions. The IDs hard-coded in v3.1.0 had all been superseded without announcement.

**Fix:** Audited every ID against the live [OpenRouter models endpoint](https://openrouter.ai/api/v1/models).

| Old (broken) | New (working) |
|---|---|
| `anthropic/claude-3.5-sonnet` | `anthropic/claude-3.7-sonnet` |
| `openai/gpt-4o` | `openai/gpt-4.1` |
| `openai/gpt-4o-mini` | `openai/gpt-4.1-mini` |
| `google/gemini-pro-1.5` | `google/gemini-2.5-pro` |
| `mistralai/mistral-large` | `mistralai/mistral-large-2512` |
| `meta-llama/llama-3.1-70b-instruct` | `meta-llama/llama-3.3-70b-instruct` |

**Lesson:** Never hard-code OpenRouter model IDs and assume permanence. Review the live endpoint each major version bump.

---

### 3. `response_format` Is OpenAI-Only

**v3.1.x → v3.2.0 · All non-OpenAI models failing with API errors**

After fixing model IDs, Claude, Gemini, Mistral, Llama, and DeepSeek still failed with cryptic errors. Different error messages per provider — took a while to find the common cause.

**Root cause:** The code sent `response_format: { type: "json_object" }` to every model. This is an OpenAI extension. Anthropic, Google, Mistral, Meta, and DeepSeek don't support it — and they return errors when they receive it.

**Fix:** Added a `JSON_MODE_MODELS` set of OpenAI model ID prefixes. The `response_format` field is only included when the model ID starts with `openai/`. All other models receive a prompt instruction to output JSON.

**Lesson:** The OpenAI Chat Completions API is a de facto standard, but its extensions are not universal. Always read each provider's specific docs before assuming OpenAI extensions work everywhere.

---

### 4. No Timeout = Infinite Hang

**v3.1.x → v3.2.1 · Cards stuck on "Reading..." forever**

Some model cards would show "Reading…" with no progress, no error, no feedback. Not all models — just some, sometimes. Users reported it consistently.

**Root cause:** `fetch()` has no built-in timeout. If OpenRouter accepted the request but the upstream model was overloaded or slow, the response could take arbitrarily long with no signal to the client.

**Fix:** `AbortController` with a 120-second timeout on every model fetch.

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 120_000);
try {
  const response = await fetch(url, { signal: controller.signal, ...options });
} finally {
  clearTimeout(timeout);
}
```

**Lesson:** Always set timeouts on fetch calls to external AI APIs. Models can queue indefinitely. A user staring at a spinner for 3 minutes with no feedback will just close the tab.

---

### 5. Browser Cached `index.html`

**v3.1.x · Users stuck on old app version after deploy**

After deploying a new version, users would still see the old app. Hard refresh fixed it consistently. Reproduced across browsers.

**Root cause:** Vite content-hashes JS and CSS bundles, so those cache correctly. But `index.html` has no hash — it's always `index.html`. Without explicit `Cache-Control` headers on `index.html`, browsers cache it for hours, keeping users on stale JS bundles.

**Fix:** `Cache-Control: no-cache, no-store, must-revalidate` on `index.html` via both the HTML `<meta>` tag and `.htaccess`. JS/CSS assets get long `max-age` headers because their filenames change with content.

**Lesson:** Vite/React apps need two caching policies: `no-cache` for `index.html`, `immutable` (or long max-age) for content-hashed assets. Vercel and Netlify handle this automatically. FTP to shared hosting does not.

---

### 6. `?lang=` URL Parameter Was Ignored

**v3.1.x → v3.2.1 · Locale links broken**

Sharing `https://clippy.legal?lang=fr` would show the English UI. The parameter was completely ignored.

**Root cause:** `detectLocale()` in `i18n.ts` checked only `localStorage` and `navigator.language`. It never read the URL `?lang=` parameter.

**Fix:** Updated `detectLocale()` to check URL params first (highest priority), then `localStorage`, then `navigator.language`, then `"en"` fallback. The chosen locale is persisted to `localStorage` so subsequent navigation keeps it.

**Lesson:** URL parameters must be the highest-priority locale signal. They're the only way to override locale programmatically — for testing, share links, and regional marketing.

---

### 7. Error Messages Always Said the Wrong Thing

**v3.0.x · Password error shown for every file parse failure**

When a PDF upload failed — for any reason — the UI showed "Incorrect password." Users found this confusing because they hadn't entered a password.

**Root cause:** The catch block in the file parser always showed the same error message, regardless of what actually went wrong.

**Fix:** Changed the catch block to read `err.message` and route to the appropriate user-facing error string: password errors show the password message; scanned PDFs show a "text not extractable" message; file too large shows a size message; other errors show a generic parse failure.

**Lesson:** Never show a generic error in a catch block without reading the actual error. AI-adjacent apps have many failure modes — users need accurate feedback to understand what went wrong and what to try next.

---

### 8. Claude-sonnet-4.6 Was Just Slow

**v3.2.1 → v3.2.2 · Users reporting Claude "stuck"**

Users reported Claude analysis appearing to hang even with the 120s timeout in place. Investigation showed the request was completing — just taking 20–35 seconds on typical contracts, compared to 3–8 seconds for GPT-4.1 on the same input.

**Root cause:** Not a bug. `claude-sonnet-4.6` was genuinely slow at the time of testing on the OpenRouter endpoint — possibly due to demand or upstream queuing.

**Fix:** Swapped the default Anthropic model to `claude-3.7-sonnet`, which consistently returns in 3–8 seconds on the same contracts. Timeout raised from 90s to 120s.

**Lesson:** Model speed is not guaranteed. Test with real contracts, not just short test paragraphs. Have a fallback. Always set a timeout.

---

### 9. The Locale Variable Missing from Destructure

**v3.0.x · App crashed silently during analysis in non-English locales**

Analysis appeared to work in English but would crash silently when triggered with the French locale active. No user-visible error — the card would just never populate.

**Root cause:** `const { t } = useI18n()` — the `locale` variable was not destructured from the hook, but it was referenced directly in the analysis call to pass the current language to the model. `locale` was `undefined`, which caused a silent failure in the API request assembly.

**Fix:** Added `locale` to the destructured variables from `useI18n()`.

**Lesson:** Destructuring omissions in TypeScript are silent when the variable is used as a string interpolation argument rather than called as a function. Always destructure everything you reference, and lean on TypeScript's strict mode to catch missing variables early.

---

## Project Structure

```
clippy/
├── client/
│   ├── index.html                    # Vite entry point + no-cache meta + font preloads
│   ├── public/
│   │   └── .htaccess                 # MIME types (.mjs → text/js) + cache headers
│   └── src/
│       ├── App.tsx                   # Router (/ and /share/:payload)
│       ├── index.css                 # CSS variables, animations, global styles
│       ├── components/
│       │   ├── ClippyCharacter.tsx   # Animated SVG paperclip mascot (3-layer depth effect)
│       │   ├── TrustScoreRing.tsx    # Animated SVG progress ring (stroke-dashoffset)
│       │   └── LanguageSwitcher.tsx  # Flag grid dropdown for 20 locales
│       ├── lib/
│       │   ├── openrouter.ts         # API client, model registry, system prompt, JSON mode gating
│       │   ├── fileParser.ts         # PDF (blob URL worker) + DOCX (mammoth) + TXT extraction
│       │   ├── encryption.ts         # AES-GCM 256-bit key encryption via Web Crypto API
│       │   ├── prompts.ts            # 10 curated analysis objectives, 5 categories
│       │   ├── export.ts             # PDF (jsPDF) + Markdown export
│       │   ├── share.ts              # Base64 URL encode/decode for SharePayload
│       │   └── i18n.ts               # Custom i18n: 20 locales, t(), I18nProvider, detectLocale()
│       └── pages/
│           ├── Home.tsx              # 3-step wizard (~1500 lines): Setup → Objectives → Results
│           └── ShareView.tsx         # Read-only shared result viewer
├── shared/
│   └── schema.ts                     # Shared TypeScript types (AppState, ModelResult, SharePayload)
├── server/                           # Express dev scaffold (not used in production)
├── CHANGELOG.md
├── CONTRIBUTING.md
├── INSTALL.md
├── SECURITY.md
└── README.md
```

---

## Adding a Model

1. Open `client/src/lib/openrouter.ts`
2. Add to `AVAILABLE_MODELS`:

```typescript
{
  id: "provider/model-name",   // from openrouter.ai/models — verify it's live
  name: "Display Name",        // shown in the model selection grid
  provider: "Provider Name",   // shown as label
  description: "Short desc",   // tooltip / card description
  icon: "P",                   // single letter avatar fallback
}
```

3. If the model is OpenAI-compatible and supports `response_format`, add its prefix to `JSON_MODE_MODELS` in the same file.

That's it. The model appears in the grid automatically. Find current IDs at [openrouter.ai/models](https://openrouter.ai/models).

---

## Customizing Analysis Objectives

### Editing the Built-in Library

`client/src/lib/prompts.ts`, in `DEFAULT_PROMPTS`:

```typescript
{
  id: "unique-id",
  title: "Short display title",
  description: "One-line description shown to users",
  prompt: `The actual instruction text sent to the model.
           Cite specific laws, articles, and case law for best results.`,
  category: "general" | "privacy" | "financial" | "employment" | "ip" | "custom",
  enabled: boolean,    // true = on by default
  isDefault: boolean,  // true = part of the shipped library
  isCustom: boolean,   // true = user-created, can be deleted
}
```

### Modifying the Core System Prompt

`SYSTEM_PROMPT` in `client/src/lib/openrouter.ts`. If you add new JSON output fields, update the relevant types in `shared/schema.ts` and the export formatters in `client/src/lib/export.ts`.

---

## Cost Estimates

Approximate cost per model for a 5,000-word contract (3 default prompts, ~8k tokens in, ~1.5k out):

| Model | Estimated cost |
|-------|---------------|
| `claude-3.5-haiku` | ~$0.002 |
| `gpt-4.1-mini` | ~$0.002 |
| `llama-3.3-70b-instruct` | ~$0.003 |
| `mistral-large-2512` | ~$0.008 |
| `gemini-2.5-pro` | ~$0.012 |
| `gpt-4.1` | ~$0.030 |
| `claude-3.7-sonnet` | ~$0.035 |

Running all 8 models: roughly **$0.10–0.15** total. The two cheapest models (Haiku + GPT-4.1 Mini) together cost under $0.01. Enabling additional objectives (Step 2) increases input tokens proportionally.

Prices change. Check [openrouter.ai/models](https://openrouter.ai/models) for current pricing.

---

## Roadmap

### Shipped
- [x] v1.0.0 — Multi-model analysis, trust score, 5 dimensions, severity flags
- [x] v2.0.0 — 3-step wizard, modular prompt library, AES-GCM encryption, PDF/MD export, share URLs
- [x] v3.0.0 — Full i18n (17 languages), RTL support, locale-aware AI output
- [x] v3.1.0 — See Demo modal, version badge, README illustration
- [x] v3.2.0 — PDF upload fix (blob URL worker), updated model IDs, password manager suppression
- [x] v3.2.1 — `?lang=` URL param, accurate file error messages, `response_format` fix, 90s timeout
- [x] v3.2.2 — claude-3.7-sonnet default, 120s timeout, no-cache `index.html`
- [x] v3.2.3 — Full code audit, improved JSDoc, comprehensive README rewrite
- [x] v3.2.4 — 20 languages (added Turkish 🇹🇷, Swedish 🇸🇪, Indonesian 🇮🇩)

### Planned
- [ ] Side-by-side diff view between model results
- [ ] Clause-by-clause highlighting (map flagged clauses back to source text)
- [ ] Template prompt sets (SaaS ToS, employment, real estate, NDA)
- [ ] Optional self-hosted backend with persistent analysis history

---

## Self-Hosting

After `npm run build`, `dist/public/` is a fully self-contained static site:

- **Cloudflare Pages** — Free, global CDN, automatic deploys from GitHub
- **Vercel / Netlify** — One-click deploy, free tier, handles cache headers automatically
- **GitHub Pages** — Push `dist/public/` contents to a `gh-pages` branch
- **Any FTP server** — Upload `dist/public/` contents to your webroot
- **S3 / R2 bucket** — Enable static website hosting, upload contents
- **Docker + nginx** — See `INSTALL.md` for a complete Dockerfile

See [INSTALL.md](./INSTALL.md) for step-by-step guides.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Areas where help is especially useful:

- **More OpenRouter models** — 5 minutes, immediate value for all users
- **Prompt improvements** — better flagging accuracy, more jurisdictions, contract-type specializations
- **Additional translations** — UI ships in 20 languages; more are welcome
- **Accessibility** — keyboard navigation, screen reader support, ARIA labels
- **Testing with edge-case contracts** — non-English contracts, unusual formats, PDFs from different generators

---

## Security

Found a security issue? See [SECURITY.md](./SECURITY.md).

Since Clippy runs entirely client-side and stores no data, the attack surface is minimal. The main consideration is ensuring the OpenRouter API key is never persisted in ways readable by other scripts. In v2+, the key is AES-GCM encrypted in browser memory — see `client/src/lib/encryption.ts` for the full technical details and honest caveats.

---

## License

MIT — see [LICENSE](./LICENSE).

Fork it. Hack it. Make it better. That's the point.

---

## Credits & References

- **AI routing** — [OpenRouter](https://openrouter.ai)
- **PDF parsing** — [pdf.js](https://mozilla.github.io/pdf.js/) by Mozilla
- **DOCX parsing** — [mammoth.js](https://github.com/mwilliamson/mammoth.js) by Mike Williamson
- **PDF export** — [jsPDF](https://github.com/parallax/jsPDF)
- **UI framework** — [React](https://react.dev) + [Vite](https://vitejs.dev) + [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Namesake** — [Clippy the Office Assistant](https://en.wikipedia.org/wiki/Office_Assistant), Microsoft Office 97–2003

### Legal References

- EU Directive 93/13/EEC — [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A31993L0013)
- GDPR 2016/679 — [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- California CCPA — [California AG](https://oag.ca.gov/privacy/ccpa)
- UK Consumer Rights Act 2015 — [legislation.gov.uk](https://www.legislation.gov.uk/ukpga/2015/15/contents/enacted)
- Federal Arbitration Act (9 U.S.C.) — [Cornell LII](https://www.law.cornell.edu/uscode/text/9)
- AT&T Mobility v. Concepcion, 563 U.S. 333 (2011) — [Supreme Court](https://www.supremecourt.gov/opinions/10pdf/09-893.pdf)
- Rome I Regulation (EC 593/2008) — [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32008R0593)
- California Labor Code § 2870 — [California Legislature](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=2870.&lawCode=LAB)
- French Code de la consommation — [Légifrance](https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006069565/)

---

## A Note on Vibe Coding and Human Leadership

> This project is **100% vibe coding**.
>
> I am not a software engineer. I have no CS degree, no MSc, would not pass a LeetCode interview, and I'm not pretending otherwise. I'm a French entrepreneur — a former hacker turned product person — who has always had a healthy obsession with technology and a very good working relationship with AI tools.
>
> Every line of TypeScript in this repository was written by an AI. Every architecture decision was a conversation. Every bug fix was describing what was broken and letting the model figure out why. The AES-GCM encryption model, the prompt library, the share URL design, the jsPDF export pipeline, the blob URL worker strategy, the `response_format` gating — all of it emerged from iteration, not from a textbook.

### What I Brought to This

The AI wrote the code. But code is not product. Here's what wasn't AI:

**Domain instinct.** I knew *why* this product needed to exist before I knew *how* to build it. Contracts are the most impactful documents most people ever sign, and almost nobody reads them carefully. That conviction didn't come from a language model — it came from years of signing contracts, negotiating, watching people get caught out by clauses they never noticed. The legal depth in this README isn't copied from a textbook — it reflects accumulated domain understanding.

**Taste and craft.** When the first version of the UI looked like every other React app — cold greys, standard card layout, forgettable — I knew it needed to be different. The warm cream palette came from thinking about what reading a contract *feels like*. The Clippy mascot came from understanding that the product's personality was as important as its function. The speech bubbles, the blink animation, the "vibe" of the thing — these are product decisions, not engineering ones.

**Debugging patience.** Most of the war stories in this README involved hours of iteration. The MIME type bug took a long time to diagnose because the local environment never triggered it — only production did. Each of those sessions required understanding what was wrong before telling the AI what to fix. The AI wrote the fix. The human read the error, formed the hypothesis, and directed the search.

**Editing and curation.** Every AI output needs a human to decide what to keep, what to discard, what to push back on. The prompt library was written and rewritten multiple times because early versions were too generic. The severity calibration was tuned against real contracts, not just theoretical ones. The war stories section exists because I believed the bugs were worth documenting, not just fixed and forgotten.

**The product roadmap.** The decision to add 17 then 20 languages wasn't an AI suggestion — it was a product decision about who Clippy should serve. The decision to make the analysis objectives modular (not hardcoded) came from watching people want to ask questions that weren't in the default set. The share URL feature came from observing that people reviewing contracts often want a second opinion from a colleague. None of these were in any original spec.

### On the Collaboration Model

Working with AI coding tools at this level is a specific skill. It's not "just describe what you want." It requires:

- **Context management** — knowing what the AI knows, what it has forgotten, and what it needs to be reminded of
- **Hypothesis formation** — when something breaks, forming a plausible root cause hypothesis before asking for a fix
- **Scope control** — AI tools have a tendency to over-engineer or refactor things that didn't need changing; knowing when to say "just fix the specific thing, don't touch the rest"
- **Quality judgment** — distinguishing between code that is correct and code that is correct *and* maintainable
- **Persistence** — the first solution is rarely the right one; good results come from multiple iterations

Clippy is a case study in what's possible when domain expertise, product instinct, and AI tooling are combined in a deliberate way. The AI was an extraordinarily capable pair programmer who never got tired, never got annoyed, and could context-switch from TypeScript to legal French to nginx MIME types without complaint. But it needed a human to set the direction, evaluate the output, and care about whether the end result was actually good.

### The Deeper Point

The barrier between "I have an idea" and "the thing exists" has collapsed. Clippy is proof of that. A project that would have required a team of three engineers and a lawyer to produce is now possible for a single person with domain knowledge and taste.

But this doesn't mean engineering depth is irrelevant. It means it's *redistributed*. The AI provides the implementation depth. The human provides the product depth. That's a different pairing than the traditional "PM writes the spec, engineer writes the code" — it's closer to a single person who can hold both simultaneously, mediated by a tool that makes the technical side tractable.

Vibe coding is not a shortcut. It's a different kind of work — one that requires deep engagement with the output, constant iteration, and the willingness to be wrong many times before being right. What it removes is the prerequisite knowledge barrier. You don't need to know AES-GCM internals before you can build an app that uses AES-GCM encryption. You need to know *why* you need encryption, understand the security model well enough to verify the implementation, and have the patience to iterate until it's correct.

That's a trade worth celebrating — and worth being honest about.

---

<div align="center">

Built by [paulfxyz](https://github.com/paulfxyz) · MIT License · [clippy.legal](https://clippy.legal)

*"It looks like you're signing a contract. Would you like help checking for nasty clauses?"*

</div>
