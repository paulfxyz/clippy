import type { ClauseFlag, Dimension, ModelResult } from "@shared/schema";

export const AVAILABLE_MODELS = [
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Best for nuanced legal reasoning",
    icon: "A",
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Fast and affordable",
    icon: "A",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Excellent general analysis",
    icon: "O",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast, cost-effective",
    icon: "O",
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini Pro 1.5",
    provider: "Google",
    description: "Long context, great at docs",
    icon: "G",
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    description: "Strong EU legal context",
    icon: "M",
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    provider: "Meta",
    description: "Open-source powerhouse",
    icon: "L",
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    description: "Strong reasoning model",
    icon: "D",
  },
];

const SYSTEM_PROMPT = `You are Clippy, an expert contract analysis AI. Your job is to analyze contracts and identify potentially problematic clauses that may work against the user's interests.

Analyze the contract text and return a JSON response with this exact structure:
{
  "trustScore": <number 0-100, where 100 is perfectly fair>,
  "summary": "<2-3 sentence plain language summary of the contract and its main risks>",
  "jurisdiction": "<detected jurisdiction or 'Unknown'>",
  "dimensions": [
    {"name": "Transparency", "score": <0-100>, "label": "<one word assessment>", "note": "<brief note>"},
    {"name": "Balance", "score": <0-100>, "label": "<one word assessment>", "note": "<brief note>"},
    {"name": "Legal Compliance", "score": <0-100>, "label": "<one word assessment>", "note": "<brief note>"},
    {"name": "Financial Risk", "score": <0-100>, "label": "<one word assessment>", "note": "<brief note>"},
    {"name": "Exit Freedom", "score": <0-100>, "label": "<one word assessment>", "note": "<brief note>"}
  ],
  "flags": [
    {
      "id": "<unique-id>",
      "title": "<short title>",
      "description": "<clear explanation of why this clause is problematic>",
      "severity": "<CRITICAL|SUSPECT|MINOR>",
      "quote": "<exact short quote from the contract, max 100 chars>"
    }
  ]
}

Severity guide:
- CRITICAL: Clause is clearly abusive, illegal, or severely disadvantages the user (e.g., hidden price escalations, impossible termination windows, unlimited liability)
- SUSPECT: Clause is unusual, one-sided, or could be manipulated against the user
- MINOR: Worth noting but common in contracts; minor inconvenience or restriction

Be thorough but precise. Only flag genuine issues, not standard boilerplate. Return ONLY valid JSON, no markdown, no explanation outside the JSON.`;

export async function analyzeWithModel(
  contractText: string,
  modelId: string,
  apiKey: string,
  customPrompt?: string
): Promise<Omit<ModelResult, "modelId" | "modelName" | "status">> {
  const userPrompt = customPrompt
    ? `${customPrompt}\n\nContract text:\n\n${contractText}`
    : `Please analyze this contract:\n\n${contractText}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://clippy.sh",
      "X-Title": "Clippy Contract Analyzer",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from model");

  let parsed: any;
  try {
    // Strip markdown code fences if model ignores the instruction
    const cleaned = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Model returned invalid JSON");
  }

  return {
    trustScore: Math.max(0, Math.min(100, Number(parsed.trustScore) || 50)),
    summary: String(parsed.summary || "No summary provided."),
    jurisdiction: String(parsed.jurisdiction || "Unknown"),
    flags: (parsed.flags || []) as ClauseFlag[],
    dimensions: (parsed.dimensions || []) as Dimension[],
  };
}
