#!/usr/bin/env node
/**
 * i18n-sync — fills missing translation keys using OpenRouter.
 *
 *   OPENROUTER_API_KEY=sk-or-... node script/i18n-sync.mjs [--review] [--only fr,de] [--dry]
 *
 * Pipeline per locale:
 *   1. find keys present in English but missing in that locale
 *   2. translate them in ONE batch (with 12 of the locale's existing strings as a style guide)
 *   3. validate: same keys, same {{placeholders}}, non-empty, not identical to English, sane length
 *   4. (--review) a DIFFERENT model reviews the batch and proposes fixes for real errors only
 *   5. write the accepted strings into client/src/lib/i18n.ts
 *
 * Honest limitation: output is AI-translated and AI-reviewed, not native-speaker reviewed.
 */
import fs from "node:fs";
import { parseLocales, placeholders, LANG_NAMES, I18N_PATH } from "./i18n-lib.mjs";

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("Set OPENROUTER_API_KEY"); process.exit(1); }
const args = process.argv.slice(2);
const REVIEW = args.includes("--review");
const DRY = args.includes("--dry");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const TRANSLATE_MODEL = process.env.TRANSLATE_MODEL || "anthropic/claude-sonnet-5.5";
const REVIEW_MODEL = process.env.REVIEW_MODEL || "openai/gpt-6.1-terra";

let totalCost = 0;
async function chat(model, system, user, attempt = 1) {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "Clippy i18n sync" },
    body: JSON.stringify({ model, temperature: 0.2, usage: { include: true }, response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if ([429, 502, 503].includes(r.status) && attempt < 3) { await new Promise(s => setTimeout(s, 3000 * attempt)); return chat(model, system, user, attempt + 1); }
  const j = await r.json();
  if (!r.ok) throw new Error(`${model}: ${j?.error?.message || r.status}`);
  totalCost += j.usage?.cost || 0;
  const txt = j.choices[0].message.content;
  try { return JSON.parse(txt); } catch { return JSON.parse(txt.match(/\{[\s\S]*\}/)[0]); }
}

const STYLE_KEYS = ["step1.title", "step1.drop_title", "step2.title", "step3.title", "step3.reading", "clippy.analyzing",
  "step1.api_key_label", "toast.file_loaded", "step2.enabled_count", "footer.tagline", "share.cta_button", "nav.shared_badge"];

function systemPrompt(lang) {
  return `You are a senior software localizer translating the user interface of "Clippy", a free open-source web app where ordinary people (not lawyers) upload a contract and several AI models flag unfair or risky clauses.
Translate from English into ${lang}.
RULES
- Natural, idiomatic, concise UI wording a native speaker would expect in a modern consumer app. Match the register (formal/informal address) of the style examples provided.
- Keep every {{placeholder}} EXACTLY as written (same name, double curly braces). Never translate placeholder names.
- Keep brand and technical tokens unchanged: Clippy, OpenRouter, GitHub, API, PDF, URL, Markdown, JSON.
- Keep punctuation conventions of ${lang}. Preserve emoji, arrows and leading symbols such as ✓ ✗ •.
- Do not add or remove information. Do not add explanations.
- Legal terms: use the standard everyday term in ${lang}, not a literal calque.
- Output ONLY a JSON object with exactly the same keys as the input, values being the translations.`;
}

function validate(en, out, keys) {
  const errs = [];
  for (const k of keys) {
    const v = out?.[k];
    if (typeof v !== "string" || !v.trim()) { errs.push(`${k}: missing/empty`); continue; }
    if (placeholders(v) !== placeholders(en[k])) errs.push(`${k}: placeholders must be [${placeholders(en[k])}]`);
    if (v.length > en[k].length * 3.2 + 12) errs.push(`${k}: suspiciously long`);
  }
  for (const k of Object.keys(out || {})) if (!keys.includes(k)) errs.push(`${k}: unexpected key`);
  return errs;
}

const { lines, locales } = parseLocales();
const en = locales.en.entries;
const log = {};
const targets = Object.keys(locales).filter(l => l !== "en" && (!only || only.includes(l)));

async function doLocale(loc) {
  const have = locales[loc].entries;
  const missing = Object.keys(en).filter(k => !(k in have));
  if (!missing.length) return null;
  const lang = LANG_NAMES[loc];
  const style = STYLE_KEYS.filter(k => k in have && k in en).map(k => ({ en: en[k], [loc]: have[k] }));
  const input = Object.fromEntries(missing.map(k => [k, en[k]]));
  let out, errs = ["init"], tries = 0, feedback = "";
  while (errs.length && tries < 3) {
    tries++;
    const user = `STYLE EXAMPLES (existing approved ${lang} strings):\n${JSON.stringify(style, null, 1)}\n\nTRANSLATE THESE ${missing.length} STRINGS:\n${JSON.stringify(input, null, 1)}${feedback}`;
    out = await chat(TRANSLATE_MODEL, systemPrompt(lang), user);
    errs = validate(en, out, missing);
    if (errs.length) feedback = `\n\nYOUR PREVIOUS ANSWER HAD THESE PROBLEMS, FIX THEM:\n${errs.join("\n")}`;
  }
  if (errs.length) throw new Error(`${loc}: validation failed after ${tries} tries: ${errs.slice(0, 5).join("; ")}`);
  let reviewed = 0, fixes = [];
  if (REVIEW) {
    const pairs = Object.fromEntries(missing.map(k => [k, { en: en[k], [loc]: out[k] }]));
    const rv = await chat(REVIEW_MODEL,
      `You are a native ${lang} proofreader and UX writer reviewing machine-translated UI strings for "Clippy", a consumer contract-analysis app. Report ONLY real errors: mistranslation, meaning change, untranslated English, wrong or inconsistent register, unnatural/awkward phrasing a native would not use, broken placeholders. Do NOT report stylistic preferences. Respond ONLY with JSON: {"fixes":[{"key":"...","problem":"short reason","fixed":"corrected ${lang} string"}]} (empty array if none). Keep {{placeholders}} intact.`,
      JSON.stringify(pairs, null, 1));
    for (const f of rv.fixes || []) {
      if (!missing.includes(f.key) || typeof f.fixed !== "string") continue;
      if (placeholders(f.fixed) !== placeholders(en[f.key]) || !f.fixed.trim()) continue;
      fixes.push({ key: f.key, problem: f.problem, before: out[f.key], after: f.fixed });
      out[f.key] = f.fixed; reviewed++;
    }
  }
  log[loc] = { language: lang, translated: missing.length, tries, reviewFixes: fixes };
  console.log(`${loc} (${lang}): ${missing.length} strings, ${tries} try(ies), ${reviewed} review fix(es)`);
  return { loc, missing, out };
}

const results = [];
let idx = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (idx < targets.length) {
    const loc = targets[idx++];
    try { const r = await doLocale(loc); if (r) results.push(r); } catch (e) { console.error("FAILED", e.message); log[loc] = { error: e.message }; }
  }
}));

if (!DRY) {
  // Write bottom-up so earlier line indexes stay valid.
  const fresh = parseLocales(fs.readFileSync(I18N_PATH, "utf8"));
  const out = fresh.lines.slice();
  for (const { loc, missing, out: tr } of results.sort((a, b) => fresh.locales[b.loc].closeLine - fresh.locales[a.loc].closeLine)) {
    const add = ["", `  // ---- Completed in v3.3.0 via script/i18n-sync.mjs (AI-translated, AI-reviewed; native corrections welcome) ----`,
      ...missing.map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(tr[k])},`)];
    out.splice(fresh.locales[loc].closeLine, 0, ...add);
  }
  fs.writeFileSync(I18N_PATH, out.join("\n"));
}
fs.mkdirSync(new URL("../docs/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("../docs/i18n-sync-log.json", import.meta.url), JSON.stringify({ translateModel: TRANSLATE_MODEL, reviewModel: REVIEW ? REVIEW_MODEL : null, openrouterCostUSD: +totalCost.toFixed(4), locales: log }, null, 1));
console.log(`done. OpenRouter cost: $${totalCost.toFixed(4)}`);
