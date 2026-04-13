# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x | ✅ Active |

## Attack Surface

Clippy's attack surface is intentionally minimal by design:

- **No backend in production** — the Express server is only used during local development
- **No database** — no persistent storage of any kind
- **No user accounts** — no authentication, no sessions, no cookies
- **No file upload to server** — contract text is extracted client-side and never sent to Clippy infrastructure
- **API key in memory only** — the OpenRouter API key is stored in React `useState()`, never in `localStorage`, `sessionStorage`, or cookies
- **Third-party dependency**: OpenRouter — all AI calls go directly from the user's browser to `openrouter.ai`

The main security considerations are:
1. **XSS** — if a crafted contract contained JavaScript that somehow executed (it won't — contracts are read as plain text and displayed in React, which escapes all output)
2. **Supply chain** — npm dependencies could theoretically be compromised
3. **The OpenRouter API key** — held in component state, visible in browser memory profilers, but no worse than any other client-side API key pattern

## Reporting a Vulnerability

If you find a security issue, please **do not open a public GitHub issue**.

Email: `hello@paulfleury.com` with subject line `[SECURITY] Clippy — <brief description>`

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional but appreciated)

You'll receive an acknowledgement within 48 hours. Fixes are prioritized and released as patch versions.

## Scope

**In scope:**
- XSS vulnerabilities in the React app
- Unintended API key exposure or persistence
- Supply chain issues in direct dependencies (`pdfjs-dist`, `mammoth`, core React/Vite packages)

**Out of scope:**
- OpenRouter API security (report those to OpenRouter directly)
- PDF/DOCX parsing security of `pdfjs-dist` and `mammoth` (report to those projects)
- Issues requiring physical access to the user's machine
- Social engineering attacks
