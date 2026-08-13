"use client";

let audioEl: HTMLAudioElement | null = null;

/**
 * Fetches and plays pronunciation audio for the given text via the TTS API.
 * Falls back silently if audio fails to load. Subsequent calls interrupt the
 * previous playback.
 */
export async function speak(
  text: string,
  opts?: { voice?: string; speed?: number }
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "auto";
  }
  // Stop anything currently playing.
  audioEl.pause();

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: opts?.voice ?? "jam",
        speed: opts?.speed ?? 0.9,
      }),
    });
    if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    audioEl.src = url;
    await audioEl.play();
    // Revoke once playback ends to free memory.
    audioEl.onended = () => {
      URL.revokeObjectURL(url);
    };
  } catch (err) {
    console.warn("speak() failed:", err);
    throw err;
  }
}
