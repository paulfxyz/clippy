#!/usr/bin/env node
// `npm run check:i18n` — fails if any locale is missing keys, has extra keys,
// has mismatched {{placeholders}}, or ships a value identical to English
// (an untranslated string). Keeps the "N languages, fully translated" claim honest.
import { parseLocales, placeholders } from "./i18n-lib.mjs";

// Values that are legitimately identical across languages.
const ALLOW_SAME = /^(Clippy|GitHub|OpenRouter|API|PDF|URL|Markdown|MD|JSON|v\d[\d.]*|sk-or-v1-\.\.\.)$|^[\d\s.,%$€£·•/+-]*$|^[^A-Za-z]*$/;

// Keys whose value is legitimately identical in some languages (brand, loanwords, cognates).
const ALLOW_SAME_KEYS = new Set([
  "nav.brand", "share.version_badge", "share.models_badge", "step1.feature_multimodel", "step1.feature_dimensions",
  "step3.dimensions", "step3.suspect", "step3.minor", "step3.download_pdf", "step3.download_md",
  "cat.privacy", "cat.general", "step2.models_singular", "step3.status_error",
]);

const { locales } = parseLocales();
const en = locales.en.entries;
let problems = 0;
const report = (loc, msg) => { problems++; console.error(`  [${loc}] ${msg}`); };

for (const [loc, { entries }] of Object.entries(locales)) {
  for (const k of Object.keys(en)) {
    if (!(k in entries)) { report(loc, `missing key ${k}`); continue; }
    if (placeholders(entries[k]) !== placeholders(en[k])) report(loc, `placeholder mismatch in ${k}`);
    if (loc !== "en" && entries[k] === en[k] && !ALLOW_SAME_KEYS.has(k) && !ALLOW_SAME.test(en[k].trim()) && en[k].length > 3) report(loc, `untranslated (identical to English): ${k}`);
  }
  for (const k of Object.keys(entries)) if (!(k in en)) report(loc, `extra key not in English: ${k}`);
}
const n = Object.keys(locales).length;
if (problems) { console.error(`\ni18n check FAILED: ${problems} problem(s) across ${n} locales`); process.exit(1); }
console.log(`i18n check passed: ${n} locales × ${Object.keys(en).length} keys, all complete`);
