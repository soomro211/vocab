import type { Word } from "./types";

/**
 * Deterministically selects a "word of the day" from the pool.
 * Uses the current date (year + day-of-year) as a seed so the same word
 * is shown all day, and it changes at midnight local time.
 */
export function getWordOfTheDay(words: Word[]): Word | null {
  if (words.length === 0) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  // Combine year + day-of-year for a stable daily seed.
  const seed = now.getFullYear() * 1000 + dayOfYear;
  const index = seed % words.length;
  return words[index];
}
