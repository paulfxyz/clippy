# Clippy model benchmark — October 2026

This document records how the model list shipped in Clippy v3.3.0 was chosen, what was measured, and, just as important, what this benchmark cannot tell you. Raw outputs, the harness and the scoring script are in [`bench/`](../bench), so every number below can be re-derived or re-run.

## TL;DR

- Fifteen current OpenRouter models were run through the production Clippy system prompt (French output locale, JSON mode requested, temperature 0.1, 12,000 max output tokens).
- Thirteen of fifteen returned valid, complete output on both documents. Two did not: `qwen/qwen3.8-max-0902` (a timeout at 240 s on the synthetic contract) and `z-ai/glm-5.3-prime` (hit the 12,000-token output limit, so the JSON was cut off).
- On the planted-issue test, every model that completed found all 10 planted problems, rated them at the right severity, and raised no false alarm on any of the 5 decoy clauses. **The test is saturated: it cannot separate the leading models from each other.** What does separate them is cost and latency, which differ by roughly two orders of magnitude.
- Result: v3.3.0 defaults to `anthropic/claude-sonnet-5.5` and `openai/gpt-6.1-terra`, and offers six more models in the picker.

## Method

### Documents

| Document | What it is | Why |
|---|---|---|
| `contract-synthetic.txt` | A SaaS agreement ("Northbeam"), written for this benchmark, with 10 planted problems and 5 decoys (clauses that look scary but are ordinary) | Gives a ground truth we control |
| `contract-real-google-tos-excerpt.txt` | An excerpt of the [Google Terms of Service](https://policies.google.com/terms) (effective July 30, 2026) | A real document with no ground truth: used for latency, cost, quote fidelity and behavioural comparison only |

Ground truth for the synthetic contract is in `bench/truth.json`.

### Scoring

For the synthetic contract: **recall** (planted issues matched by a flag whose quote hits the planted clause), **severity accuracy** (matched at or above the expected severity), **decoy false positives**, and **quote fidelity** (share of quoted passages that really appear verbatim in the source). A model also needs to answer in the requested language and return valid JSON in time. `bench/score.mjs` combines these into a 0–100 composite (weights: recall 45, severity 15, quote fidelity 15, decoys 10, language 10, reliability 5). The composite is a convenience of mine, not a standard metric.

### Harness

`bench/run-benchmark.mjs` imports the production system prompt from `client/src/lib/openrouter.ts`, so the benchmark exercises what Clippy actually sends. Cost figures are the `usage.cost` values OpenRouter reports for each call.

## Results

Cost and time are the mean of the two runs (one per document). Quote fidelity is shown for synthetic / real.

| Model | Valid runs | Recall | Severity | Decoy FPs | Quote fidelity | Time per run | Cost per analysis | Composite |
|---|---|---|---|---|---|---|---|---|
| `minimax/minimax-m3.1-flash` | 2/2 | 10/10 | 100% | 0 | 1.00 / 1.00 | 4–9 s | $0.0015 | 100 |
| `deepseek/deepseek-v4.1-flash-1017` | 2/2 | 10/10 | 100% | 0 | 1.00 / 1.00 | 27–50 s | $0.0026 | 100 |
| `anthropic/claude-haiku-5.5` | 2/2 | 10/10 | 100% | 0 | 1.00 / 1.00 | 24–29 s | $0.0037 | 100 |
| `openai/gpt-6.1-terra` | 2/2 | 10/10 | 100% | 0 | 1.00 / 1.00 | 17–24 s | $0.0091 | 100 |
| `openai/gpt-6.1-sol` | 2/2 | 10/10 | 100% | 0 | 1.00 / 1.00 | 22–33 s | $0.0200 | 100 |
| `google/gemini-4-argon` | 2/2 | 10/10 | 100% | 0 | 1.00 / 0.83 | 22–33 s | $0.0223 | 99 |
| `meta/muse-spark-open` | 2/2 | 10/10 | 100% | 0 | 0.92 / 1.00 | 31–57 s | $0.0235 | 99 |
| `mistralai/mistral-large-4-0` | 2/2 | 10/10 | 100% | 0 | 1.00 / 1.00 | 39–63 s | $0.0283 | 100 |
| `x-ai/grok-4.7` | 2/2 | 10/10 | 100% | 0 | 1.00 / 1.00 | 49–85 s | $0.0321 | 100 |
| `anthropic/claude-sonnet-5.5` | 2/2 | 10/10 | 100% | 0 | 1.00 / 1.00 | 18–20 s | $0.0381 | 100 |
| `moonshotai/kimi-k3.1-pro` | 2/2 | 10/10 | 100% | 0 | 1.00 / 1.00 | 197–226 s | $0.0759 | 100 |
| `anthropic/claude-opus-5.5` | 2/2 | 10/10 | 100% | 0 | 1.00 / 1.00 | 33–46 s | $0.1073 | 100 |
| `anthropic/claude-fable-5.1` | 2/2 | 10/10 | 100% | 0 | 1.00 / 1.00 | 48–57 s | $0.2751 | 100 |
| `qwen/qwen3.8-max-0902` | 1/2 | — | — | — | — / 1.00 | 214 s (real); timed out at 240 s (synthetic) | — | failed |
| `z-ai/glm-5.3-prime` | 1/2 | — | — | — | — / 1.00 | 64 s (real); truncated at 12,000 tokens (synthetic) | — | failed |

`mistral-large-4-0` was rate-limited (HTTP 429) on its first attempt and succeeded on the retry; Clippy now retries once on 429/502/503/504 for this reason.

### What the numbers do and do not say

1. **A perfect score is a statement about the test, not about the models.** Ten planted issues in a deliberately readable contract are easy for 2026 frontier models. If you read "100" as "this model never misses anything", you are over-reading it. The next version of this benchmark needs harder, subtler ground truth (cross-references, definitions that change a clause's meaning, issues that only exist in combination).
2. **One run per model per document, temperature 0.1.** There are no confidence intervals. Differences in the last digit of the composite (99 vs 100) are noise-level and come down to one or two quote mismatches.
3. **Two documents.** One is synthetic and was written by me; one is a real excerpt with no ground truth.
4. **Severity judgements on the real excerpt differ a lot between models** (trust scores 45–66; only Mistral raised a CRITICAL flag, n = 1). That is the number to treat with caution: it shows models disagree on real contracts, which is exactly why Clippy runs several side by side.
5. **Latency was measured from one location at one time of day** and depends on OpenRouter's provider routing.
6. **Not legal advice.** Nothing here measures whether a model's legal reasoning is correct for your jurisdiction.

## Decisions taken from this data

| Decision | Reason |
|---|---|
| Default: `anthropic/claude-sonnet-5.5` + `openai/gpt-6.1-terra` | Two different vendors (their disagreements are informative), both 100 on the test, ~20 s each, about $0.05 together |
| Offer `gemini-4-argon`, `claude-haiku-5.5`, `mistral-large-4-0`, `deepseek-v4.1-flash-1017`, `grok-4.7`, `claude-opus-5.5` | Valid, fast enough (under the 120 s timeout) and covering budget, EU, alternative-vendor and deep-analysis use cases |
| Do not offer `claude-fable-5.1` | Identical results to Sonnet 5.5 here at about 7× the cost |
| Do not offer `kimi-k3.1-pro` | Correct, but 197–226 s per run exceeds Clippy's 120 s request timeout |
| Do not offer `qwen3.8-max` or `glm-5.3-prime` | Failed on one of two documents (timeout and output truncation) |
| Do not offer `minimax-m3.1-flash` and `muse-spark-open` in the main picker | Excellent results at very low cost for MiniMax, but two runs each is thin evidence for a default-picker slot; they are easy to add (see "Adding a model" in the README) |

## Reproduce

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
cd bench
node run-benchmark.mjs fr                  # all models, French locale
node run-benchmark.mjs fr anthropic/claude-haiku-5.5   # one model
node score.mjs results-fr.json             # score against truth.json
```

A full run of all fifteen models over both documents cost roughly two to three US dollars on OpenRouter in October 2026. Prices and model availability change; check [openrouter.ai/models](https://openrouter.ai/models).
