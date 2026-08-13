import type { QuizSession } from "./store";

export interface QuizHistoryStats {
  totalQuizzes: number;
  totalQuestions: number;
  totalCorrect: number;
  averageAccuracy: number;
  averageScore: number;
  perfectQuizzes: number;
  timedQuizzes: number;
  recentTrend: { ts: number; accuracy: number; total: number }[];
}

export function getQuizHistoryStats(
  sessions: QuizSession[]
): QuizHistoryStats {
  if (sessions.length === 0) {
    return {
      totalQuizzes: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      averageAccuracy: 0,
      averageScore: 0,
      perfectQuizzes: 0,
      timedQuizzes: 0,
      recentTrend: [],
    };
  }

  const totalQuestions = sessions.reduce((a, s) => a + s.total, 0);
  const totalCorrect = sessions.reduce((a, s) => a + s.correct, 0);
  const perfectQuizzes = sessions.filter((s) => s.perfect).length;
  const timedQuizzes = sessions.filter((s) => s.timed).length;
  const averageAccuracy =
    totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
  const averageScore =
    sessions.length > 0
      ? sessions.reduce((a, s) => a + (s.total > 0 ? s.correct / s.total : 0), 0) /
        sessions.length
      : 0;

  // Last 10 sessions for the trend, oldest → newest.
  const recentTrend = sessions
    .slice(-10)
    .map((s) => ({
      ts: s.ts,
      accuracy: s.total > 0 ? s.correct / s.total : 0,
      total: s.total,
    }));

  return {
    totalQuizzes: sessions.length,
    totalQuestions,
    totalCorrect,
    averageAccuracy,
    averageScore,
    perfectQuizzes,
    timedQuizzes,
    recentTrend,
  };
}

export function formatRelativeTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (day > 7) {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  if (day > 0) return `${day}d ago`;
  if (hr > 0) return `${hr}h ago`;
  if (min > 0) return `${min}m ago`;
  return "just now";
}
