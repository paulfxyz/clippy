// Shared helpers for the i18n tooling (parity check + translation sync).
import fs from "node:fs";

export const I18N_PATH = new URL("../client/src/lib/i18n.ts", import.meta.url);

/** Parses every `const xx: TranslationDict = { ... };` block into { locale: { key: value } }. */
export function parseLocales(src = fs.readFileSync(I18N_PATH, "utf8")) {
  const lines = src.split("\n");
  const locales = {};
  let cur = null;
  lines.forEach((line, idx) => {
    const m = line.match(/^const (\w+): TranslationDict = \{/);
    if (m) { cur = m[1]; locales[cur] = { entries: {}, closeLine: -1 }; return; }
    if (cur && line.startsWith("};")) { locales[cur].closeLine = idx; cur = null; return; }
    if (cur) {
      // Some locale blocks pack several "key": "value" pairs on one line — match them all.
      for (const k of line.matchAll(/"([\w.]+)":\s*("(?:[^"\\]|\\.)*")/g)) {
        try { locales[cur].entries[k[1]] = JSON.parse(k[2]); }
        catch { locales[cur].entries[k[1]] = k[2].slice(1, -1); }
      }
    }
  });
  return { lines, locales };
}

export const placeholders = (s) => [...String(s).matchAll(/\{\{\w+\}\}/g)].map(m => m[0]).sort().join("|");

export const LANG_NAMES = {
  fr: "French", es: "Spanish", pt: "Portuguese (European)", de: "German", nl: "Dutch", it: "Italian",
  zh: "Chinese (Simplified)", ru: "Russian", hi: "Hindi", bg: "Bulgarian", pl: "Polish", da: "Danish",
  ja: "Japanese", ko: "Korean", he: "Hebrew", ar: "Arabic", tr: "Turkish", sv: "Swedish", id: "Indonesian",
};
