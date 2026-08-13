import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const cache = new Map<string, { synonyms: string[]; antonyms: string[] }>();
const CACHE_MAX = 120;

function getCached(key: string) {
  const v = cache.get(key);
  if (v) {
    cache.delete(key);
    cache.set(key, v);
  }
  return v;
}

function setCached(key: string, val: { synonyms: string[]; antonyms: string[] }) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, val);
  if (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
}

const BodySchema = z.object({
  term: z.string().min(1).max(100),
  definition: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  let payload: z.infer<typeof BodySchema>;
  try {
    const json = await req.json();
    payload = BodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { term, definition } = payload;
  const cacheKey = term.toLowerCase();

  let result = getCached(cacheKey);
  if (!result) {
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();

      const systemPrompt =
        "You are a vocabulary expert. For the given word, provide 3-5 synonyms " +
        "and 2-3 antonyms. Respond with ONLY a JSON object: " +
        '{"synonyms": ["word1", "word2", ...], "antonyms": ["word1", "word2", ...]}. ' +
        "No preamble, no explanation, no markdown — just the JSON object.";

      const userPrompt = `Word: "${term}"\nDefinition: ${definition}\n\nProvide synonyms and antonyms as JSON.`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        thinking: { type: "disabled" },
      });

      const raw =
        completion.choices[0]?.message?.content?.trim() ??
        '{"synonyms":[],"antonyms":[]}';

      // Try to parse the JSON response; fall back to empty arrays.
      try {
        const parsed = JSON.parse(raw);
        result = {
          synonyms: Array.isArray(parsed.synonyms)
            ? parsed.synonyms.slice(0, 6)
            : [],
          antonyms: Array.isArray(parsed.antonyms)
            ? parsed.antonyms.slice(0, 4)
            : [],
        };
      } catch {
        result = { synonyms: [], antonyms: [] };
      }
      setCached(cacheKey, result);
    } catch (err) {
      console.error("Synonyms API error:", err);
      return NextResponse.json(
        { error: "Failed to generate synonyms" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(result);
}
