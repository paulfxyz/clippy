# Contributing to Clippy

Thanks for your interest in contributing. Clippy is a small, focused open-source project — contributions that improve the core experience are welcome.

---

## Ways to Contribute

### High-value contributions
- **Adding new OpenRouter models** — 5 minutes of work, immediate value for all users
- **Improving the system prompt** — better flagging accuracy, more dimensions, contract-type specializations
- **Translations** — UI ships in 17 languages; adding more or improving existing translations is very welcome
- **Accessibility** — keyboard navigation, screen reader support, ARIA labels
- **Testing with unusual contracts** — non-English contracts, unusual formats, edge cases

### Medium-effort contributions
- **Dark mode toggle** — CSS variables are already defined, just needs a button and a `useEffect` to toggle the `dark` class
- **New output dimensions** — additional scoring dimensions (e.g. "Data Privacy", "Intellectual Property")
- **Password-protected PDF support** — pdf.js supports decryption with a user-supplied password; exposing this in the UI would help encrypted contracts

### Welcome but complex
- **Optional backend** — persistent analysis history, saved sessions
- **Contract diff mode** — compare two versions of the same contract

---

## Development Setup

```bash
git clone https://github.com/paulfxyz/clippy.git
cd clippy
npm install
npm run dev
```

The dev server runs at `http://localhost:5000`. All changes to `client/src/` hot-reload instantly.

---

## Code Standards

### TypeScript
- Strict mode is enabled. No `any` unless genuinely unavoidable (and comment why)
- All exported functions and components should have JSDoc comments
- Types for API responses go in `shared/schema.ts`

### Components
- One component per file (exception: small sub-components tightly coupled to a parent)
- Use Tailwind utility classes for styling, not inline `style={}` (exception: dynamic SVG values)
- shadcn/ui components for common UI patterns (buttons, inputs, cards, badges, tabs)

### Comments
- Comment the **why**, not the **what** — the code shows what; comments explain intent, trade-offs, and gotchas
- Every function exported from `lib/` should have a JSDoc block

### Git
- Branch names: `feat/dark-mode-toggle`, `fix/pdf-worker-load`, `docs/install-fly-io`
- Commit messages: imperative mood, concise — "Add dark mode toggle", "Fix pdf.js worker loading"
- One concern per PR

---

## Adding a Model

The fastest contribution. Open `client/src/lib/openrouter.ts`:

```typescript
export const AVAILABLE_MODELS = [
  // ... existing models
  {
    id: "provider/model-name",    // from openrouter.ai/models
    name: "Display Name",
    provider: "Provider Name",
    description: "One sentence about strengths",
    icon: "P",                    // Single letter, shown in avatar
    tag: "balanced",              // balanced | fast | deep | budget | longctx | eu | alt
    costPerAnalysis: 0.02,        // USD, measured
    seconds: 30,                  // typical time, measured
    context: 200_000,
  },
];
```

Please measure the model first (`cd bench && OPENROUTER_API_KEY=... node run-benchmark.mjs fr provider/model-name`) and include validity, time and cost in the PR. Models slower than the 120-second request timeout cannot be offered.

---

## Submitting a PR

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Test locally with `npm run dev`
5. Run `npm run check` (type-check plus the i18n completeness check: every locale must have every key) and then `npm run build`

**Translations:** adding a UI string means adding it to all 20 locales. `npm run i18n:sync` (needs `OPENROUTER_API_KEY`) drafts the missing ones with an LLM and has a second model review them; native-speaker corrections to any language are very welcome.
6. Push and open a PR against `main`

PRs should include:
- Description of what changed and why
- Screenshots for UI changes
- Any relevant OpenRouter model ID sources

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/paulfxyz/clippy/issues) with:
- Browser and OS
- File format that triggered the bug
- Which model(s) were selected
- Console errors (open DevTools → Console tab)
- Steps to reproduce

For security issues, see [SECURITY.md](./SECURITY.md).
