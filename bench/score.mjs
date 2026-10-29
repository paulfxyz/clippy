// Scores benchmark results against the planted ground truth (truth.json).
import fs from "node:fs";
const files = process.argv.slice(2);
const results = files.flatMap(f => JSON.parse(fs.readFileSync(f, "utf8")));
// de-dup: keep last successful result per model+contract
const byKey = new Map();
for (const r of results) { const k = r.model + "|" + r.contract; if (!byKey.has(k) || r.httpStatus === 200) byKey.set(k, r); }
const truth = JSON.parse(fs.readFileSync("truth.json", "utf8"));
const syn = fs.readFileSync("contract-synthetic.txt", "utf8");
const real = fs.readFileSync("contract-real-google-tos-excerpt.txt", "utf8");
const norm = s => s.toLowerCase().replace(/[“”"']/g, "").replace(/\s+/g, " ").replace(/\.\.\./g, "").replace(/…/g, "").trim();
const FR = /\b(le|la|les|des|est|du|une|un|et|que|qui|pour|dans|sur|avec|pas|vous|au|aux|ce|cette|sont|ne)\b/gi;
function frRatio(t) { const w = t.split(/\s+/).filter(Boolean); if (!w.length) return 0; return (t.match(FR) || []).length / w.length; }
const sevRank = { CRITICAL: 3, SUSPECT: 2, MINOR: 1 };
const models = {};
for (const r of byKey.values()) { (models[r.model] ||= {})[r.contract] = r; }
const rows = [];
for (const [model, c] of Object.entries(models)) {
  const row = { model };
  for (const cname of ["synthetic", "real"]) {
    const r = c[cname]; const src = cname === "synthetic" ? syn : real;
    const p = r?.parsed;
    row[cname] = { ok: !!(r && r.httpStatus === 200 && r.jsonValid), http: r?.httpStatus, err: r?.error, ms: r?.ms, cost: r?.cost, finish: r?.finish, jsonModeRejected: r?.jsonModeRejected, tokensOut: r?.tokensOut };
    if (!p) continue;
    const flags = Array.isArray(p.flags) ? p.flags : [];
    const txt = norm(src);
    const quotes = flags.map(f => norm(String(f.quote || ""))).filter(q => q.length > 8);
    row[cname].flags = flags.length; row[cname].trust = p.trustScore;
    row[cname].quoteFidelity = quotes.length ? quotes.filter(q => txt.includes(q)).length / quotes.length : 0;
    row[cname].sev = { C: flags.filter(f => f.severity === "CRITICAL").length, S: flags.filter(f => f.severity === "SUSPECT").length, M: flags.filter(f => f.severity === "MINOR").length };
    const allText = [p.summary, ...flags.map(f => f.title + " " + f.description)].join(" ");
    row[cname].frRatio = frRatio(allText);
    if (cname === "synthetic") {
      let hit = 0, sevOk = 0, sevMinOk = 0;
      const missed = [];
      for (const t of truth.planted) {
        const re = new RegExp(t.re, "i");
        const m = flags.filter(f => re.test(String(f.quote || "")));
        if (m.length) { hit++; const best = Math.max(...m.map(f => sevRank[f.severity] || 0)); if (best >= sevRank[t.sev]) sevOk++; if (best >= 2) sevMinOk++; } else missed.push(t.id);
      }
      let fp = 0;
      for (const d of truth.decoys) { const re = new RegExp(d.re, "i"); if (flags.some(f => re.test(String(f.quote || "")) && (sevRank[f.severity] || 0) >= 2)) fp++; }
      row[cname].recall = hit / truth.planted.length; row[cname].sevAcc = hit ? sevOk / hit : 0; row[cname].decoyFP = fp; row[cname].missed = missed;
      // flags that match neither planted nor decoy
      const all = [...truth.planted, ...truth.decoys].map(t => new RegExp(t.re, "i"));
      row[cname].otherFlags = flags.filter(f => !all.some(re => re.test(String(f.quote || "")))).length;
    }
  }
  const s = row.synthetic, rl = row.real;
  row.ok = s.ok && rl.ok;
  // transparent composite (0-100): recall 45, severity accuracy 15, quote fidelity 15, decoy discipline 10, language 10, reliability 5
  if (s.recall !== undefined) {
    const fid = ((s.quoteFidelity || 0) + (rl.quoteFidelity || 0)) / (rl.quoteFidelity !== undefined ? 2 : 1);
    const lang = Math.min(1, (((s.frRatio || 0) + (rl.frRatio || 0)) / 2) / 0.22);
    row.score = Math.round(45 * s.recall + 15 * s.sevAcc + 15 * fid + 10 * Math.max(0, 1 - s.decoyFP / 3) + 10 * lang + 5 * (s.ok && rl.ok ? 1 : 0));
    row.cost = (s.cost || 0) + (rl.cost || 0); row.avgMs = ((s.ms || 0) + (rl.ms || 0)) / 2;
  }
  rows.push(row);
}
rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
fs.writeFileSync("scored.json", JSON.stringify(rows, null, 1));
console.log("model | score | recall | sevAcc | decoyFP | quoteFid(s/r) | fr% | flags(s/r) | s | $/2runs");
for (const r of rows) { const s = r.synthetic, l = r.real;
  console.log([r.model, r.score ?? "FAIL", s.recall !== undefined ? (s.recall * 100).toFixed(0) + "%" : "-", s.sevAcc !== undefined ? (s.sevAcc * 100).toFixed(0) + "%" : "-", s.decoyFP ?? "-",
    s.quoteFidelity !== undefined ? `${(s.quoteFidelity * 100).toFixed(0)}/${((l.quoteFidelity || 0) * 100).toFixed(0)}` : "-", s.frRatio !== undefined ? (s.frRatio * 100).toFixed(0) : "-", `${s.flags ?? "-"}/${l.flags ?? "-"}`,
    r.avgMs ? (r.avgMs / 1000).toFixed(0) : "-", r.cost ? r.cost.toFixed(3) : "-", s.err || l.err || (s.missed?.length ? "missed:" + s.missed.join(",") : "")].join(" | ")); }
