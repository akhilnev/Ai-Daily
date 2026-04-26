import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Brief, BriefItem } from "@/lib/brief";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const today = new Date().toDateString();
    const PROMPT = `Today is ${today}. You are an AI research assistant. Search the web for the most significant AI developments from the past 48 hours across these categories:
- model: new model releases, API updates, benchmarks (Anthropic, OpenAI, Google DeepMind, Meta AI, Mistral, xAI, etc.)
- research: notable papers from arXiv cs.AI/cs.LG/cs.CL or major lab blogs
- tools: new developer tools, inference infra, Hugging Face releases, LangChain, frameworks
- industry: funding, acquisitions, policy, significant company moves

Return exactly 5-6 items as a JSON array. For each item, provide substantive technical detail. Each object:
{
  "title": "concise headline max 10 words",
  "category": "model" | "research" | "tools" | "industry",
  "summary": "2-3 sentences explaining what happened",
  "keyPoints": ["exactly 8 bullet points with specific facts, numbers, benchmarks, dates, and comparisons to prior work. Be precise, not vague."],
  "links": [{"label": "Source name", "url": "URL"}],
  "fdeApplications": ["2 specific ways this applies to a Palantir FDE building on Foundry/AIP — mention Ontology, Pipeline Builder, or customer deployment scenarios"],
  "relevance": "1 sentence on why an FDE should care",
  "source": "source name",
  "imageQuery": "3-4 word image search query"
}

Include 1-2 URLs per item in links. Keep keyPoints factual and concise (one sentence each).

Return ONLY valid JSON array, no markdown fences. Prioritize recency — last 48 hours only.`;

    // Stream to keep Vercel connection alive during long web searches
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send a keep-alive comment while Claude is working
          const keepAlive = setInterval(() => {
            controller.enqueue(encoder.encode(" "));
          }, 5000);

          const response = await (client.messages.create as any)({
            model: "claude-sonnet-4-20250514",
            max_tokens: 8000,
            tools: [{ type: "web_search_20250305", name: "web_search" }],
            messages: [{ role: "user", content: PROMPT }],
          });

          clearInterval(keepAlive);

          const textBlock = response.content.find((b: any) => b.type === "text");
          if (!textBlock) throw new Error("No text response from Claude");

          let raw = textBlock.text.trim();
          raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
          const start = raw.indexOf("[");
          const end = raw.lastIndexOf("]");
          if (start === -1 || end === -1) throw new Error("No JSON array in response");

          const items: BriefItem[] = JSON.parse(raw.slice(start, end + 1));
          const brief: Brief = {
            items,
            generatedAt: new Date().toISOString(),
            date: new Date().toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric", year: "numeric",
            }),
          };

          controller.enqueue(encoder.encode(JSON.stringify(brief)));
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: err.message })));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
