import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const cache = new Map<string, string>();
const CACHE_MAX = 120;

function getCached(key: string): string | undefined {
  const v = cache.get(key);
  if (v) {
    cache.delete(key);
    cache.set(key, v);
  }
  return v;
}

function setCached(key: string, val: string) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, val);
  if (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
}

const BodySchema = z.object({
  term: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  let payload: z.infer<typeof BodySchema>;
  try {
    const json = await req.json();
    payload = BodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { term } = payload;
  const cacheKey = term.toLowerCase();

  let etymology = getCached(cacheKey);
  if (!etymology) {
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();

      const systemPrompt =
        "You are an etymology expert. Provide a concise, accurate word origin (etymology) " +
        "for the given word. Include the root language (Latin, Greek, Old English, etc.), " +
        "the original root word and its meaning, and how it evolved. Keep it to 2-3 sentences. " +
        "Respond with ONLY the etymology — no preamble, no labels, no quotes.";

      const userPrompt = `What is the etymology of the word "${term}"?`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        thinking: { type: "disabled" },
      });

      etymology =
        completion.choices[0]?.message?.content?.trim() ??
        "Could not generate etymology right now.";
      setCached(cacheKey, etymology);
    } catch (err) {
      console.error("Etymology API error:", err);
      return NextResponse.json(
        { error: "Failed to generate etymology" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ etymology });
}
