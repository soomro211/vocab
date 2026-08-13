import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// In-memory LRU cache so repeated word pronunciations are instant.
// Keyed by `text|voice|speed`. We cache the generated audio buffer.
const cache = new Map<string, Buffer>();
const CACHE_MAX = 80;

function getCached(key: string): Buffer | undefined {
  const v = cache.get(key);
  if (v) {
    // Refresh recency
    cache.delete(key);
    cache.set(key, v);
  }
  return v;
}

function setCached(key: string, buf: Buffer) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, buf);
  if (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
}

const BodySchema = z.object({
  text: z.string().min(1).max(1024),
  voice: z.string().optional(),
  speed: z.number().min(0.5).max(2).optional(),
});

export async function POST(req: NextRequest) {
  let payload: z.infer<typeof BodySchema>;
  try {
    const json = await req.json();
    payload = BodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const text = payload.text.trim();
  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const voice = payload.voice ?? "jam";
  const speed = payload.speed ?? 0.9;
  const cacheKey = `${text}|${voice}|${speed}`;

  let buffer = getCached(cacheKey);
  if (!buffer) {
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();
      const response = await zai.audio.tts.create({
        input: text,
        voice,
        speed,
        response_format: "wav",
        stream: false,
      });
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(new Uint8Array(arrayBuffer));
      setCached(cacheKey, buffer);
    } catch (err) {
      console.error("TTS API error:", err);
      return NextResponse.json(
        { error: "Failed to generate audio" },
        { status: 500 }
      );
    }
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
