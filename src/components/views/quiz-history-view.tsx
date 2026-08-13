"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Trophy,
  Target,
  Clock,
  Flame,
  TrendingUp,
  Award,
  CheckCircle2,
  Timer,
  History,
} from "lucide-react";
import { useVocabStore } from "@/lib/store";
import {
  getQuizHistoryStats,
  formatRelativeTime,
} from "@/lib/quiz-history";
import { formatPercent } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TabKey } from "@/lib/types";

interface QuizHistoryViewProps {
  onNavigate: (tab: TabKey) => void;
}

export function QuizHistoryView({ onNavigate }: QuizHistoryViewProps) {
  const quizSessions = useVocabStore((s) => s.quizSessions);
  const stats = useMemo(
    () => getQuizHistoryStats(quizSessions),
    [quizSessions]
  );

  // Reverse for display (newest first).
  const sessions = useMemo(
    () => [...quizSessions].reverse(),
    [quizSessions]
  );

  const chartData = useMemo(
    () =>
      stats.recentTrend.map((s, i) => ({
        index: i + 1,
        accuracy: Math.round(s.accuracy * 100),
        label: `Q${i + 1}`,
      })),
    [stats.recentTrend]
  );

  if (quizSessions.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <header>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Quiz History
          </div>
          <h1 className="mt-1.5 font-serif-display text-3xl font-medium tracking-tight md:text-4xl">
            Your quiz journey
          </h1>
        </header>
        <Card className="gap-0 p-10 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-border/70 bg-muted/30">
            <History
              className="size-6 text-muted-foreground"
              strokeWidth={1.25}
            />
          </div>
          <h3 className="mt-4 font-serif-display text-lg font-medium">
            No quizzes yet
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Take your first quiz to start building your history. Each completed
            quiz is recorded here with your score and timing.
          </p>
          <Button
            size="sm"
            className="mx-auto mt-5 rounded-full"
            onClick={() => onNavigate("quiz")}
          >
            <Target className="size-3.5" strokeWidth={1.75} />
            Take a quiz
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Quiz History
          </div>
          <h1 className="mt-1.5 font-serif-display text-3xl font-medium tracking-tight md:text-4xl">
            Your quiz journey
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => onNavigate("quiz")}
        >
          <Target className="size-3.5" strokeWidth={1.75} />
          New quiz
        </Button>
      </header>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryStat
          icon={History}
          label="Quizzes"
          value={stats.totalQuizzes}
        />
        <SummaryStat
          icon={CheckCircle2}
          label="Correct"
          value={stats.totalCorrect}
          accent="mastered"
        />
        <SummaryStat
          icon={Trophy}
          label="Perfect"
          value={stats.perfectQuizzes}
          accent="mastered"
        />
        <SummaryStat
          icon={Target}
          label="Avg accuracy"
          value={formatPercent(stats.averageAccuracy)}
          accent="learning"
        />
      </div>

      {/* Accuracy trend */}
      {chartData.length >= 2 && (
        <Card className="gap-0 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp
                className="size-4 text-muted-foreground"
                strokeWidth={1.75}
              />
              <div>
                <h2 className="text-sm font-semibold">Accuracy trend</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Last {chartData.length} quizzes
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              Avg {formatPercent(stats.averageScore)}
            </span>
          </div>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="oklch(1 0 0 / 0.06)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: "oklch(0.63 0.008 264)",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  tick={{
                    fill: "oklch(0.63 0.008 264)",
                    fontSize: 11,
                  }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.215 0.004 264)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: "oklch(0.96 0.002 264)",
                  }}
                  formatter={(value: number) => [`${value}%`, "Accuracy"]}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="var(--mastered)"
                  strokeWidth={2}
                  dot={{
                    fill: "var(--mastered)",
                    r: 3,
                  }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Session list */}
      <Card className="gap-0 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Sessions</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {sessions.length} total
          </span>
        </div>
        <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
          {sessions.map((s, i) => {
            const acc = s.total > 0 ? s.correct / s.total : 0;
            const isPerfect = s.perfect;
            return (
              <motion.div
                key={`${s.ts}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                  isPerfect
                    ? "border-mastered/30 bg-mastered/5"
                    : acc >= 0.8
                    ? "border-border/60 bg-muted/20"
                    : "border-border/60 bg-muted/10"
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                    isPerfect
                      ? "border-mastered/30 bg-mastered/15 text-mastered"
                      : acc >= 0.5
                      ? "border-learning/30 bg-learning/10 text-learning"
                      : "border-border/60 bg-muted/30 text-muted-foreground"
                  )}
                >
                  {isPerfect ? (
                    <Trophy className="size-4" strokeWidth={1.75} />
                  ) : (
                    <Target className="size-4" strokeWidth={1.75} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif-display text-sm font-medium">
                      {s.correct}/{s.total}
                    </span>
                    {isPerfect && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-mastered/15 px-1.5 py-0.5 text-[10px] font-medium text-mastered">
                        <Award className="size-2.5" strokeWidth={2} />
                        Perfect
                      </span>
                    )}
                    {s.timed && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <Timer className="size-2.5" strokeWidth={2} />
                        Timed
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatRelativeTime(s.ts)}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      "font-serif-display text-lg font-medium tabular-nums",
                      acc >= 0.8
                        ? "text-mastered"
                        : acc >= 0.5
                        ? "text-learning"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatPercent(acc)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  accent?: "mastered" | "learning";
}) {
  return (
    <Card className="gap-0 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <Icon
          className={cn(
            "size-3",
            accent === "mastered" && "text-mastered",
            accent === "learning" && "text-learning",
            !accent && "text-muted-foreground"
          )}
          strokeWidth={1.75}
        />
      </div>
      <div
        className={cn(
          "mt-2 font-serif-display text-2xl font-medium tracking-tight tabular-nums",
          accent === "mastered" && "text-mastered",
          accent === "learning" && "text-learning",
          !accent && "text-foreground"
        )}
      >
        {value}
      </div>
    </Card>
  );
}
