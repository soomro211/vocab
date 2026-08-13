import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// In-memory cache so repeated requests for the same word are instant.
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
  definition: z.string().min(1).max(500),
  example: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let payload: z.infer<typeof BodySchema>;
  try {
    const json = await req.json();
    payload = BodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { term, definition, example } = payload;
  const cacheKey = `${term}|${definition}`;

  let mnemonic = getCached(cacheKey);
  if (!mnemonic) {
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();

      const systemPrompt =
        "You are a study coach who creates vivid, memorable mnemonics for SAT vocabulary. " +
        "Your mnemonics are short (2-3 sentences max), use wordplay, imagery, or associations " +
        "with the word's sound or spelling, and are easy to recall during a test. " +
        "Respond with ONLY the mnemonic — no preamble, no labels, no quotes.";

      const userPrompt = `Create a mnemonic to remember the word "${term}".
Definition: ${definition}${example ? `\nExample: ${example}` : ""}

The mnemonic should connect the word "${term}" to its meaning in a memorable way. Keep it concise and vivid.`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        thinking: { type: "disabled" },
      });

      mnemonic =
        completion.choices[0]?.message?.content?.trim() ??
        "Could not generate a mnemonic right now.";
      setCached(cacheKey, mnemonic);
    } catch (err) {
      console.error("Mnemonic API error:", err);
      return NextResponse.json(
        { error: "Failed to generate mnemonic" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ mnemonic });
}
