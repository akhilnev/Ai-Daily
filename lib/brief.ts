import Anthropic from "@anthropic-ai/sdk";

export type Category = "model" | "research" | "tools" | "industry";

export interface BriefItem {
  title: string;
  category: Category;
  summary: string;
  keyPoints: string[];
  links: { label: string; url: string }[];
  fdeApplications: string[];
  relevance: string;
  source: string;
  imageQuery: string;
}

export interface Brief {
  items: BriefItem[];
  generatedAt: string;
  date: string;
}

const PROMPT = `Today is ${new Date().toDateString()}. You are an AI research assistant. Search the web for the most significant AI developments from the past 48 hours across these categories:
- model: new model releases, API updates, benchmarks (Anthropic, OpenAI, Google DeepMind, Meta AI, Mistral, xAI, etc.)
- research: notable papers from arXiv cs.AI/cs.LG/cs.CL or major lab blogs
- tools: new developer tools, inference infra, Hugging Face releases, LangChain, frameworks
- industry: funding, acquisitions, policy, significant company moves

Return exactly 6-8 items as a JSON array. For each item, go DEEP — provide substantive technical detail, not just surface-level news. Each object:
{
  "title": "concise headline max 10 words",
  "category": "model" | "research" | "tools" | "industry",
  "summary": "2-3 sentences explaining what happened in plain language",
  "keyPoints": [
    "8-10 specific, detailed bullet points covering: technical specs, benchmark numbers, architecture changes, pricing, availability, key limitations, comparisons to prior work, notable reactions from the community, and any caveats or controversies. Each point should be a complete sentence with specific cited facts (e.g. 'Scores 92.3% on MMLU, up from 87.1% in the previous version — source: official blog post'). Do NOT be vague — include numbers, dates, names, and specifics."
  ],
  "links": [
    { "label": "descriptive label e.g. Official Announcement", "url": "actual URL to the source" },
    { "label": "another resource", "url": "URL" }
  ],
  "fdeApplications": [
    "2-3 specific, actionable ways this development applies to a Palantir Forward Deployed Engineer's work — mention concrete Foundry/AIP workflows, Ontology patterns, Pipeline Builder integrations, customer deployment scenarios, or how this changes the way you'd architect a solution for a government/enterprise client. Be specific, not generic."
  ],
  "relevance": "1-2 sentence high-level relevance summary for an FDE",
  "source": "source name e.g. Anthropic blog, arXiv, TechCrunch",
  "imageQuery": "3-4 word image search query"
}

Provide 2-3 real, working URLs per item in the links array (official blog posts, paper links, GitHub repos, etc.). For keyPoints, aim for exactly 8-10 points that would give someone a thorough understanding without needing to read the original source.

Return ONLY valid JSON array, no markdown fences, no explanation. Prioritize recency — last 48 hours only.`;

export async function fetchBrief(): Promise<Brief> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await (client.messages.create as any)({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: PROMPT }],
  });

  const textBlock = response.content.find((b: any) => b.type === "text");
  if (!textBlock) throw new Error("No text response from Claude");

  let raw = textBlock.text.trim();
  raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array in response");

  const items: BriefItem[] = JSON.parse(raw.slice(start, end + 1));

  return {
    items,
    generatedAt: new Date().toISOString(),
    date: new Date().toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    }),
  };
}
