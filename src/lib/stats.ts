import type { Category, Word, WordProgress } from "./types";
import type { ActivityEvent } from "./store";

export interface CategoryStats {
  total: number;
  new: number;
  learning: number;
  mastered: number;
  learned: number;
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy: number; // 0..1
  bestStreak: number;
  currentBestStreak: number;
}

export interface OverallStats {
  total: number;
  new: number;
  learning: number;
  mastered: number;
  learned: number;
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  bestStreak: number;
}

export function computeStats(
  words: Word[],
  progress: Record<string, WordProgress>
): CategoryStats {
  let total = words.length;
  let nNew = 0;
  let learning = 0;
  let mastered = 0;
  let learned = 0;
  let attempted = 0;
  let correct = 0;
  let incorrect = 0;
  let bestStreak = 0;
  let currentBestStreak = 0;

  for (const w of words) {
    const p = progress[w.id];
    if (!p) {
      nNew += 1;
      continue;
    }
    if (p.status === "new") nNew += 1;
    else if (p.status === "learning") learning += 1;
    else if (p.status === "mastered") mastered += 1;

    if (p.learned) learned += 1;
    if (p.correctCount + p.incorrectCount > 0) attempted += 1;
    correct += p.correctCount;
    incorrect += p.incorrectCount;
    if (p.bestStreak > bestStreak) bestStreak = p.bestStreak;
    if (p.currentStreak > currentBestStreak) currentBestStreak = p.currentStreak;
  }

  const answered = correct + incorrect;
  const accuracy = answered > 0 ? correct / answered : 0;

  return {
    total,
    new: nNew,
    learning,
    mastered,
    learned,
    attempted,
    correct,
    incorrect,
    accuracy,
    bestStreak,
    currentBestStreak,
  };
}

export function overallFromCategory(
  byCategory: Record<Category, CategoryStats>
): OverallStats {
  const cats = Object.values(byCategory);
  const total = cats.reduce((a, c) => a + c.total, 0);
  const nNew = cats.reduce((a, c) => a + c.new, 0);
  const learning = cats.reduce((a, c) => a + c.learning, 0);
  const mastered = cats.reduce((a, c) => a + c.mastered, 0);
  const learned = cats.reduce((a, c) => a + c.learned, 0);
  const attempted = cats.reduce((a, c) => a + c.attempted, 0);
  const correct = cats.reduce((a, c) => a + c.correct, 0);
  const incorrect = cats.reduce((a, c) => a + c.incorrect, 0);
  const bestStreak = cats.reduce((a, c) => Math.max(a, c.bestStreak), 0);
  const answered = correct + incorrect;
  const accuracy = answered > 0 ? correct / answered : 0;
  return {
    total,
    new: nNew,
    learning,
    mastered,
    learned,
    attempted,
    correct,
    incorrect,
    accuracy,
    bestStreak,
  };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick `n` random distractor definitions from the pool, excluding the answer. */
export function pickDistractors(
  pool: Word[],
  answer: Word,
  n: number
): Word[] {
  const candidates = pool.filter((w) => w.id !== answer.id);
  return shuffle(candidates).slice(0, n);
}

export function formatPercent(ratio: number): string {
  if (!isFinite(ratio) || ratio <= 0) return "0%";
  return `${Math.round(ratio * 100)}%`;
}

export interface ActivityDay {
  /** ISO date (yyyy-mm-dd) */
  date: string;
  /** Short weekday label, e.g. "Mon" */
  label: string;
  total: number;
  correct: number;
  incorrect: number;
}

/**
 * Buckets activity events into the last `days` calendar days (including
 * today). Returns an array ordered oldest → newest so it can be charted
 * left-to-right.
 */
export function getActivityTrend(
  activity: ActivityEvent[],
  days = 7
): ActivityDay[] {
  const result: ActivityDay[] = [];
  const now = new Date();
  // Normalize to local midnight.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const dayStart = day.getTime();
    const dayEnd = next.getTime();

    const events = activity.filter(
      (e) => e.ts >= dayStart && e.ts < dayEnd
    );
    const correct = events.filter((e) => e.correct).length;
    const incorrect = events.length - correct;

    result.push({
      date: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      total: events.length,
      correct,
      incorrect,
    });
  }
  return result;
}

/** Totals across the last N days. */
export function getActivitySummary(activity: ActivityEvent[], days = 7) {
  const trend = getActivityTrend(activity, days);
  const total = trend.reduce((a, d) => a + d.total, 0);
  const correct = trend.reduce((a, d) => a + d.correct, 0);
  const activeDays = trend.filter((d) => d.total > 0).length;
  return {
    total,
    correct,
    incorrect: total - correct,
    activeDays,
    accuracy: total > 0 ? correct / total : 0,
  };
}

/**
 * Computes the current consecutive-day study streak (including today if there
 * is any activity today). Walks backwards from today; the streak breaks on the
 * first day with zero activity. Returns 0 if there was no activity today (the
 * streak is "broken" until the user studies again).
 *
 * If `streakFreezes` > 0, a single-day gap is forgiven by consuming one freeze.
 *
 * Also returns `bestStreak` — the longest run of consecutive active days found
 * across the entire activity history.
 */
export function getStudyStreak(
  activity: ActivityEvent[],
  streakFreezes = 0
): {
  current: number;
  best: number;
  studiedToday: boolean;
  freezesUsed: number;
} {
  if (activity.length === 0)
    return { current: 0, best: 0, studiedToday: false, freezesUsed: 0 };

  // Build a set of unique day-timestamps (midnight) that have activity.
  const daySet = new Set<number>();
  for (const e of activity) {
    const d = new Date(e.ts);
    const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    daySet.add(midnight);
  }
  const days = Array.from(daySet).sort((a, b) => a - b);

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  // Current streak: count backwards from today (or yesterday if nothing today).
  let current = 0;
  let freezesUsed = 0;
  const studiedToday = daySet.has(today);
  let cursor = today;

  // If not studied today, streak resumes from yesterday only if continuous
  // (or a freeze can cover today's gap).
  if (!studiedToday) {
    cursor = today - dayMs;
    if (!daySet.has(cursor)) {
      // Try using a freeze to cover today's gap.
      if (streakFreezes > 0 && daySet.has(cursor - dayMs)) {
        freezesUsed++;
        // Skip today, start counting from yesterday.
      } else {
        return {
          current: 0,
          best: bestStreak(days),
          studiedToday: false,
          freezesUsed: 0,
        };
      }
    }
  }

  while (daySet.has(cursor)) {
    current++;
    cursor -= dayMs;
    // Check for a gap: if the previous day isn't active, try a freeze.
    if (!daySet.has(cursor) && daySet.has(cursor - dayMs) && freezesUsed < streakFreezes) {
      freezesUsed++;
      cursor -= dayMs; // Skip the frozen day.
    }
  }

  return { current, best: bestStreak(days), studiedToday, freezesUsed };
}

function bestStreak(sortedDays: number[]): number {
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  const dayMs = 24 * 60 * 60 * 1000;
  for (const d of sortedDays) {
    if (prev !== null && d - prev === dayMs) {
      run++;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Counts how many questions were answered today (local midnight → now). */
export function getTodayCount(activity: ActivityEvent[]): {
  total: number;
  correct: number;
} {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const todays = activity.filter((e) => e.ts >= todayStart);
  return {
    total: todays.length,
    correct: todays.filter((e) => e.correct).length,
  };
}

/** Breaks down activity by category over the last N days. */
export function getActivityByCategory(
  activity: ActivityEvent[],
  days = 7
): Record<Category, { total: number; correct: number }> {
  const now = new Date();
  const cutoff = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime() - (days - 1) * 24 * 60 * 60 * 1000;

  const result: Record<Category, { total: number; correct: number }> = {
    vocabulary: { total: 0, correct: 0 },
    transitions: { total: 0, correct: 0 },
  };

  for (const e of activity) {
    if (e.ts < cutoff) continue;
    result[e.category].total++;
    if (e.correct) result[e.category].correct++;
  }
  return result;
}
