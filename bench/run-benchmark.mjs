// Clippy model benchmark harness.
// Usage: OPENROUTER_API_KEY=... node run-benchmark.mjs [locale] [modelId ...]
// Uses the *production* system prompt extracted from client/src/lib/openrouter.ts.
import fs from "node:fs";
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) throw new Error("Set OPENROUTER_API_KEY");
const LOCALE = process.argv[2] || "fr";
const LANG = { en:"English", fr:"French", es:"Spanish", pt:"Portuguese", de:"German" }[LOCALE] || "English";
const src = fs.readFileSync("../client/src/lib/openrouter.ts", "utf8");
const base = eval("`" + src.match(/const SYSTEM_PROMPT_BASE = `([\s\S]*?)`;\n/)[1] + "`");
const system = LOCALE === "en" ? base :
  `LANGUAGE INSTRUCTION: All human-readable text fields in your JSON output ("summary", flag "title", flag "description", dimension "label", dimension "note") MUST be written in ${LANG}. JSON field names (keys) must remain in English. The "quote" field must always contain the verbatim original text from the contract (do not translate quoted contract text).\n\n${base}`;
const CONTRACTS = {
  synthetic: fs.readFileSync("contract-synthetic.txt", "utf8"),
  real: fs.readFileSync("contract-real-google-tos-excerpt.txt", "utf8"),
};
const MODELS = process.argv.slice(3).length ? process.argv.slice(3) : [
  "anthropic/claude-fable-5.1","anthropic/claude-opus-5.5","anthropic/claude-sonnet-5.5","anthropic/claude-haiku-5.5",
  "openai/gpt-6.1-sol","openai/gpt-6.1-terra","google/gemini-4-argon","x-ai/grok-4.7",
  "mistralai/mistral-large-4-0","deepseek/deepseek-v4.1-flash-1017","moonshotai/kimi-k3.1-pro",
  "qwen/qwen3.8-max-0902","z-ai/glm-5.3-prime","meta/muse-spark-open","minimax/minimax-m3.1-flash",
];
// Same 3-layer parser as production (openrouter.ts)
function parse(content) {
  try { return JSON.parse(content); } catch {}
  try { return JSON.parse(content.replace(/^```json?\n?/i,"").replace(/\n?```$/i,"").trim()); } catch {}
  const m = content.match(/\{[\s\S]*\}/); if (!m) throw new Error("no json"); return JSON.parse(m[0]);
}
async function call(model, text, jsonMode) {
  const body = { model, temperature: 0.1, max_tokens: 12000, usage: { include: true },
    messages: [{ role:"system", content: system }, { role:"user", content: `Please analyze this contract:\n\n${text}` }] };
  if (jsonMode) body.response_format = { type: "json_object" };
  const t0 = Date.now();
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 240000);
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method:"POST", signal: ctl.signal,
      headers: { Authorization:`Bearer ${KEY}`, "Content-Type":"application/json", "HTTP-Referer":"https://clippy.legal", "X-Title":"Clippy benchmark" },
      body: JSON.stringify(body) });
    const j = await r.json(); return { status: r.status, j, ms: Date.now()-t0 };
  } catch (e) { return { status: 0, j: { error: { message: String(e) } }, ms: Date.now()-t0 }; }
  finally { clearTimeout(to); }
}
async function runOne(model, cname) {
  let jsonMode = true;
  let res = await call(model, CONTRACTS[cname], true);
  let jsonModeRejected = false;
  if (res.status === 400 || res.status === 404 && /response_format|json/i.test(JSON.stringify(res.j))) {
    jsonModeRejected = true; jsonMode = false; res = await call(model, CONTRACTS[cname], false);
  }
  const out = { model, contract: cname, locale: LOCALE, httpStatus: res.status, ms: res.ms, jsonModeRejected };
  if (res.status !== 200) { out.error = res.j?.error?.message || JSON.stringify(res.j).slice(0,200); return out; }
  const c = res.j.choices?.[0]; out.finish = c?.finish_reason; out.provider = res.j.provider;
  out.cost = res.j.usage?.cost ?? null; out.tokensIn = res.j.usage?.prompt_tokens; out.tokensOut = res.j.usage?.completion_tokens;
  out.reasoningTokens = res.j.usage?.completion_tokens_details?.reasoning_tokens ?? 0;
  const content = c?.message?.content || ""; out.raw = content;
  try { out.parsed = parse(content); out.jsonValid = true; } catch (e) { out.jsonValid = false; out.parseError = String(e).slice(0,100); }
  return out;
}
const jobs = []; for (const m of MODELS) for (const c of Object.keys(CONTRACTS)) jobs.push([m,c]);
const results = []; let i = 0;
async function worker() { while (i < jobs.length) { const [m,c] = jobs[i++]; const r = await runOne(m,c);
  console.log(`${m} [${c}] http=${r.httpStatus} json=${r.jsonValid} ${r.ms}ms $${r.cost} ${r.error||""}`); results.push(r);
  fs.writeFileSync(`results-${LOCALE}.json`, JSON.stringify(results, null, 1)); } }
await Promise.all(Array.from({ length: 6 }, worker));
console.log("done", results.length);
