# 📎 Clippy — AI Contract Analyzer

> It looks like you're signing a contract. Would you like help checking for nasty clauses?

**Clippy** is an open-source, browser-only contract analyzer that uses multiple AI models via [OpenRouter](https://openrouter.ai) to detect abusive, suspicious, or risky clauses in any contract.

Inspired by [small-print.ai](https://small-print.ai/) — but free, open source, and running entirely in your browser.

## Features

- 📄 **Upload PDF, DOCX, TXT, or MD** — text extracted client-side, never sent to our servers
- 🔑 **Your OpenRouter API key** — you pay your own costs, no middleman
- 🤖 **8+ AI models** — Claude, GPT-4o, Gemini, Mistral, Llama, DeepSeek, and more
- ⚡ **Parallel analysis** — all selected models run simultaneously
- 🎯 **5 dimensions** — Transparency, Balance, Legal Compliance, Financial Risk, Exit Freedom
- 🚩 **Severity flags** — CRITICAL, SUSPECT, MINOR with exact quotes from the contract
- 🔒 **100% private** — no file storage, no logs, no backend

## How it works

1. Drop your contract (PDF/DOCX/TXT)
2. Enter your [OpenRouter API key](https://openrouter.ai/keys)
3. Pick one or more AI models
4. Optionally add custom instructions (e.g. "focus on GDPR compliance")
5. Get a Trust Score (0-100) with flagged clauses sorted by severity

## Tech stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **PDF extraction:** pdf.js (client-side)
- **DOCX extraction:** mammoth (client-side)
- **AI:** OpenRouter API (direct from browser)
- **Zero backend required** for core functionality

## Development

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

## Self-hosting

Just serve the `dist/public` folder as a static site. No server needed.

## License

MIT — fork it, hack it, make it better.

---

Made with ❤️ as an open-source alternative to proprietary contract analysis tools.
