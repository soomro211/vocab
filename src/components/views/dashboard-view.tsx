"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ArrowRight,
  Award,
  Layers,
  Target,
  Flame,
  Sparkles,
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  Share2,
  History,
} from "lucide-react";
import { useVocabStore, MASTERY_THRESHOLD } from "@/lib/store";
import { useVocabStats } from "@/lib/use-vocab-stats";
import { CATEGORY_META } from "@/lib/word-data";
import {
  formatPercent,
  getActivityTrend,
  getActivitySummary,
  getActivityByCategory,
  getStudyStreak,
  getTodayCount,
} from "@/lib/stats";
import { getWordOfTheDay } from "@/lib/word-of-day";
import type { TabKey, Word } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status-badge";
import { SpeakButton } from "@/components/speak-button";
import { QuizHistoryDialog } from "@/components/quiz-history-dialog";
import { toast } from "sonner";

interface DashboardViewProps {
  onNavigate: (tab: TabKey) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const activeCategory = useVocabStore((s) => s.activeCategory);
  const getWordsForCategory = useVocabStore((s) => s.getWordsForCategory);
  const progress = useVocabStore((s) => s.progress);
  const activity = useVocabStore((s) => s.activity);
  const stats = useVocabStats();

  const [activityWindow, setActivityWindow] = useState<7 | 30>(7);
  const [historyOpen, setHistoryOpen] = useState(false);
  const activityTrend = useMemo(
    () => getActivityTrend(activity, activityWindow),
    [activity, activityWindow]
  );
  const activitySummary = useMemo(
    () => getActivitySummary(activity, activityWindow),
    [activity, activityWindow]
  );
  const activityByCategory = useMemo(
    () => getActivityByCategory(activity, activityWindow),
    [activity, activityWindow]
  );
  const streakFreezes = useVocabStore((s) => s.settings.streakFreezes);
  const hideDefaults = useVocabStore((s) => s.settings.hideDefaults);
  const studyStreak = useMemo(
    () => getStudyStreak(activity, streakFreezes),
    [activity, streakFreezes]
  );
  const todayCount = useMemo(() => getTodayCount(activity), [activity]);
  const dailyGoal = useVocabStore((s) => s.settings.dailyGoal);
  const setSettings = useVocabStore((s) => s.setSettings);

  const meta = CATEGORY_META[activeCategory];
  const active = stats.active;

  const masteryRatio = active.total > 0 ? active.mastered / active.total : 0;
  const learnedRatio = active.total > 0 ? active.learned / active.total : 0;

  const donutData = [
    { name: "Mastered", value: active.mastered, color: "var(--mastered)" },
    { name: "Learning", value: active.learning, color: "var(--learning)" },
    { name: "New", value: active.new, color: "var(--new)" },
  ].filter((d) => d.value > 0);
  const hasProgress = active.mastered + active.learning > 0;

  // hideDefaults triggers re-render when the pre-made lists are toggled.
  void hideDefaults;
  const allWords = getWordsForCategory(activeCategory);
  const needsAttention: Word[] = allWords
    .map((w) => ({ w, p: progress[w.id] }))
    .filter(
      ({ p }) =>
        p && p.correctCount + p.incorrectCount > 0 && p.status !== "mastered"
    )
    .sort((a, b) => {
      const accA = a.p!.correctCount / (a.p!.correctCount + a.p!.incorrectCount);
      const accB = b.p!.correctCount / (b.p!.correctCount + b.p!.incorrectCount);
      return accA - accB;
    })
    .slice(0, 5)
    .map(({ w }) => w);

  const recentMastery: Word[] = allWords
    .filter((w) => progress[w.id]?.status === "mastered")
    .slice(0, 4);

  const wordOfDay = getWordOfTheDay(allWords);

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Dashboard
          </div>
          <h1 className="mt-1 font-serif-display text-3xl font-medium tracking-tight sm:mt-1.5 md:text-5xl">
            {meta.label}
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground text-pretty">
            {meta.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="rounded-full"
          >
            <History className="size-3.5" strokeWidth={1.75} />
            History
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const s = stats.overall;
              const text = [
                `Lexicon — SAT Vocabulary Progress`,
                `${meta.label}: ${s.mastered}/${s.total} mastered (${formatPercent(s.mastered / Math.max(s.total, 1))})`,
                `Accuracy: ${formatPercent(s.accuracy)} · Best streak: ${s.bestStreak}`,
                `Study streak: ${studyStreak.current} day${studyStreak.current !== 1 ? "s" : ""}`,
                `Daily goal: ${todayCount.total}/${dailyGoal}`,
              ].join("\n");
              navigator.clipboard
                .writeText(text)
                .then(() => toast.success("Progress summary copied to clipboard"))
                .catch(() => toast.error("Couldn't copy to clipboard"));
            }}
            className="rounded-full"
          >
            <Share2 className="size-3.5" strokeWidth={1.75} />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("flashcards")}
            className="rounded-full"
          >
            <Layers className="size-3.5" strokeWidth={1.75} />
            Study
          </Button>
          <Button
            size="sm"
            onClick={() => onNavigate("quiz")}
            className="rounded-full"
          >
            <Target className="size-3.5" strokeWidth={1.75} />
            Take a quiz
          </Button>
        </div>
      </motion.section>

      {/* Streak + daily goal */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StreakBanner
            current={studyStreak.current}
            best={studyStreak.best}
            studiedToday={studyStreak.studiedToday}
            freezesAvailable={streakFreezes}
            freezesUsed={studyStreak.freezesUsed}
            onNavigate={onNavigate}
          />
        </div>
        <DailyGoalCard
          answered={todayCount.total}
          correct={todayCount.correct}
          goal={dailyGoal}
          onGoalChange={(g) => setSettings({ dailyGoal: g })}
          onNavigate={onNavigate}
        />
      </div>

      {/* Word of the Day */}
      {wordOfDay && (
        <WordOfTheDayCard word={wordOfDay} onNavigate={onNavigate} />
      )}

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 md:gap-4">
        <StatCard
          icon={Layers}
          label="Total words"
          value={active.total}
          hint={`${active.attempted} attempted`}
          delay={0.02}
        />
        <StatCard
          icon={Award}
          label="Mastered"
          value={active.mastered}
          hint={formatPercent(masteryRatio)}
          accent="mastered"
          delay={0.06}
        />
        <StatCard
          icon={Target}
          label="Accuracy"
          value={formatPercent(active.accuracy)}
          hint={`${active.correct}/${active.correct + active.incorrect}`}
          accent="learning"
          delay={0.1}
        />
        <StatCard
          icon={Flame}
          label="Best streak"
          value={active.bestStreak}
          hint={`${active.currentBestStreak} current`}
          delay={0.14}
        />
      </section>

      {/* Mastery + Donut */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 gap-0 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold">Mastery breakdown</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Distribution across the {meta.label.toLowerCase()} list
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatPercent(masteryRatio)} mastered
            </span>
          </div>
          <div className="space-y-5 px-6 py-6">
            <MasteryRow
              label="Mastered"
              value={active.mastered}
              total={active.total}
              color="var(--mastered)"
            />
            <MasteryRow
              label="Learning"
              value={active.learning}
              total={active.total}
              color="var(--learning)"
            />
            <MasteryRow
              label="New"
              value={active.new}
              total={active.total}
              color="var(--new)"
            />
            <div className="border-t border-border/60 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Marked as learned
                </span>
                <span className="font-medium">
                  {active.learned} / {active.total}
                </span>
              </div>
              <Progress
                value={learnedRatio * 100}
                className="mt-2 h-1.5 bg-foreground/10"
              />
            </div>
          </div>
        </Card>

        <Card className="gap-0 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Status mix</h2>
            <Sparkles
              className="size-3.5 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <div className="relative mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* Background track ring — always a clean full circle */}
                <Pie
                  data={[{ name: "track", value: 1 }]}
                  dataKey="value"
                  innerRadius={58}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive={false}
                >
                  <Cell fill="oklch(1 0 0 / 0.05)" />
                </Pie>
                {hasProgress && (
                  <Pie
                    data={donutData}
                    dataKey="value"
                    innerRadius={58}
                    outerRadius={80}
                    paddingAngle={donutData.length > 1 ? 2 : 0}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    cornerRadius={donutData.length === 1 ? 40 : 0}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                )}
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif-display text-3xl font-medium">
                {active.mastered}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Mastered
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {[
              {
                label: "Mastered",
                value: active.mastered,
                color: "var(--mastered)",
              },
              {
                label: "Learning",
                value: active.learning,
                color: "var(--learning)",
              },
              { label: "New", value: active.new, color: "var(--new)" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: row.color }}
                  />
                  {row.label}
                </span>
                <span className="font-medium tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Accuracy ring + cross-category */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="gap-0 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Accuracy</h2>
            <TrendingUp
              className="size-3.5 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <div className="relative mt-3 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="72%"
                outerRadius="100%"
                data={[
                  {
                    name: "accuracy",
                    value: active.accuracy * 100,
                    fill: "var(--learning)",
                  },
                ]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  dataKey="value"
                  background={{ fill: "var(--foreground)", fillOpacity: 0.06 }}
                  cornerRadius={20}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif-display text-2xl font-medium">
                {formatPercent(active.accuracy)}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Correct
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{active.correct} correct</span>
            <span>{active.incorrect} incorrect</span>
          </div>
        </Card>

        <Card className="md:col-span-2 gap-0 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Across categories</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Compare progress on both word lists
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {(
              Object.keys(stats.byCategory) as Array<
                keyof typeof stats.byCategory
              >
            ).map((cat) => {
              const s = stats.byCategory[cat];
              const ratio = s.total > 0 ? s.mastered / s.total : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{cat}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {s.mastered}/{s.total} · {formatPercent(s.accuracy)} acc
                    </span>
                  </div>
                  <Progress
                    value={ratio * 100}
                    className="mt-2 h-1.5 bg-foreground/10"
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            <Flame
              className="size-3.5 shrink-0 text-learning"
              strokeWidth={1.75}
            />
            Answer a word correctly {MASTERY_THRESHOLD} times in a row to mark it
            mastered. One miss sends it back to learning.
          </div>
        </Card>
      </section>

      {/* Activity trend */}
      <section>
        <Card className="gap-0 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays
                className="size-4 text-muted-foreground"
                strokeWidth={1.75}
              />
              <div>
                <h2 className="text-sm font-semibold">
                  {activityWindow}-day activity
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Questions answered over the past{" "}
                  {activityWindow === 7 ? "week" : "month"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-mastered" />
                {activitySummary.correct} correct
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-destructive/70" />
                {activitySummary.incorrect} missed
              </span>
              <span className="text-muted-foreground tabular-nums">
                {activitySummary.activeDays}/{activityWindow} active days
              </span>
              <div className="flex items-center gap-0.5 rounded-full border border-border/70 bg-card/60 p-0.5">
                {([7, 30] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setActivityWindow(w)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                      activityWindow === w
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {w}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activitySummary.total === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 py-10 text-center">
              <TrendingUp
                className="size-5 text-muted-foreground/50"
                strokeWidth={1.25}
              />
              <p className="mt-3 text-sm text-muted-foreground">
                No activity yet this week
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Take a quiz to start filling in your trend.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => onNavigate("quiz")}
              >
                <Target className="size-3.5" strokeWidth={1.75} />
                Start a quiz
              </Button>
            </div>
          ) : (
            <div className="mt-6">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activityTrend}
                    margin={{ top: 4, right: 0, left: -22, bottom: 0 }}
                    barCategoryGap="22%"
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
                      tickLine={false}
                      axisLine={false}
                      width={28}
                      tick={{
                        fill: "oklch(0.63 0.008 264)",
                        fontSize: 11,
                      }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                      contentStyle={{
                        background: "oklch(0.215 0.004 264)",
                        border: "1px solid oklch(1 0 0 / 0.1)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        color: "oklch(0.96 0.002 264)",
                      }}
                      labelStyle={{ color: "oklch(0.63 0.008 264)" }}
                    />
                    <Bar
                      dataKey="correct"
                      stackId="a"
                      fill="var(--mastered)"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="incorrect"
                      stackId="a"
                      fill="oklch(0.68 0.18 22 / 0.7)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Best day: {Math.max(...activityTrend.map((d) => d.total))}{" "}
                  answered
                </span>
                <span>
                  Weekly accuracy:{" "}
                  {formatPercent(activitySummary.accuracy)}
                </span>
              </div>
              {activityByCategory.vocabulary.total +
                activityByCategory.transitions.total >
                0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-4">
                  {(
                    ["vocabulary", "transitions"] as const
                  ).map((cat) => {
                    const d = activityByCategory[cat];
                    const acc =
                      d.total > 0 ? d.correct / d.total : 0;
                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2"
                      >
                        <span className="text-xs font-medium capitalize">
                          {cat}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
                          <span>{d.total} Q</span>
                          <span
                            className={
                              acc >= 0.8
                                ? "text-mastered"
                                : acc > 0
                                ? "text-learning"
                                : ""
                            }
                          >
                            {formatPercent(acc)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* Needs attention + recent mastery */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-0 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Needs attention</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Lowest-accuracy words still in progress
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-full text-xs"
              onClick={() => onNavigate("quiz")}
            >
              Practice
              <ArrowRight className="size-3" />
            </Button>
          </div>
          <div className="mt-4 space-y-1">
            {needsAttention.length === 0 && (
              <EmptyHint text="Nothing here yet — start a quiz to surface words to focus on." />
            )}
            {needsAttention.map((w) => {
              const p = progress[w.id]!;
              const total = p.correctCount + p.incorrectCount;
              const acc = total > 0 ? p.correctCount / total : 0;
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-serif-display text-base font-medium">
                      {w.term}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {w.definition}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium tabular-nums">
                      {formatPercent(acc)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {p.currentStreak}/{MASTERY_THRESHOLD} streak
                    </div>
                  </div>
                  <StatusBadge status={p.status} showIcon={false} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="gap-0 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Recently mastered</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Words you&apos;ve locked in
              </p>
            </div>
            <Award className="size-4 text-mastered" strokeWidth={1.5} />
          </div>
          <div className="mt-4 space-y-1">
            {recentMastery.length === 0 && (
              <EmptyHint text="Master your first three correct answers to see words appear here." />
            )}
            {recentMastery.map((w) => {
              const p = progress[w.id]!;
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-serif-display text-base font-medium">
                      {w.term}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {w.definition}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground">
                    {p.bestStreak} streak
                  </div>
                  <StatusBadge status="mastered" showIcon={false} />
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <QuizHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onNavigate={onNavigate}
      />
    </div>
  );
}

const GOAL_PRESETS = [5, 10, 20, 30];

function DailyGoalCard({
  answered,
  correct,
  goal,
  onGoalChange,
  onNavigate,
}: {
  answered: number;
  correct: number;
  goal: number;
  onGoalChange: (g: number) => void;
  onNavigate: (tab: TabKey) => void;
}) {
  const ratio = goal > 0 ? Math.min(answered / goal, 1) : 0;
  const complete = answered >= goal && goal > 0;
  const [editing, setEditing] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="relative h-full overflow-hidden p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-xl border",
                complete
                  ? "border-mastered/30 bg-mastered/10"
                  : "border-border/60 bg-muted/30"
              )}
            >
              {complete ? (
                <CheckCircle2
                  className="size-4 text-mastered"
                  strokeWidth={1.75}
                />
              ) : (
                <Target
                  className="size-4 text-muted-foreground"
                  strokeWidth={1.75}
                />
              )}
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Daily goal
              </div>
              <div className="font-serif-display text-lg font-medium">
                {complete ? "Done!" : `${answered}/${goal}`}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {editing ? "Done" : "Edit"}
          </button>
        </div>

        {editing ? (
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {GOAL_PRESETS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  onGoalChange(g);
                  setEditing(false);
                }}
                className={cn(
                  "rounded-lg border py-2 text-xs font-medium transition-all",
                  goal === g
                    ? "border-foreground/40 bg-foreground/5 text-foreground"
                    : "border-border/70 text-muted-foreground hover:text-foreground"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  complete ? "bg-mastered" : "bg-foreground/70"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${ratio * 100}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {correct} correct · {answered - correct} missed
              </span>
              {complete ? (
                <span className="inline-flex items-center gap-1 text-mastered">
                  <Sparkles className="size-3" strokeWidth={1.75} />
                  Goal met
                </span>
              ) : (
                <span className="tabular-nums">
                  {Math.max(goal - answered, 0)} to go
                </span>
              )}
            </div>
            {!complete && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 h-7 w-full rounded-full text-xs"
                onClick={() => onNavigate("quiz")}
              >
                Take a quiz
                <ArrowRight className="size-3" />
              </Button>
            )}
          </>
        )}
      </Card>
    </motion.div>
  );
}

function WordOfTheDayCard({
  word,
  onNavigate,
}: {
  word: Word;
  onNavigate: (tab: TabKey) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="relative overflow-hidden p-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_100%_0%,oklch(0.72_0.1_162/0.06),transparent_60%)]"
        />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-muted/30">
              <Sparkles
                className="size-5 text-learning"
                strokeWidth={1.5}
              />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Word of the day
              </div>
              <div className="mt-1 flex items-center gap-2">
                <h3 className="font-serif-display text-2xl font-medium tracking-tight">
                  {word.term}
                </h3>
                {word.partOfSpeech && (
                  <span className="text-[11px] italic text-muted-foreground">
                    {word.partOfSpeech}
                  </span>
                )}
                <SpeakButton term={word.term} size="icon" className="size-6" />
              </div>
              <p className="mt-1 text-sm text-foreground/80 text-pretty">
                {word.definition}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => onNavigate("flashcards")}
          >
            <Layers className="size-3.5" strokeWidth={1.75} />
            Study this
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function StreakBanner({
  current,
  best,
  studiedToday,
  freezesAvailable,
  freezesUsed,
  onNavigate,
}: {
  current: number;
  best: number;
  studiedToday: boolean;
  freezesAvailable: number;
  freezesUsed: number;
  onNavigate: (tab: TabKey) => void;
}) {
  const hasStreak = current > 0;
  const freezesLeft = freezesAvailable - freezesUsed;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        className={cn(
          "relative overflow-hidden p-0",
          hasStreak && "glow-mastered"
        )}
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 opacity-60",
            hasStreak
              ? "bg-[radial-gradient(80%_120%_at_0%_0%,oklch(0.72_0.1_162/0.08),transparent_60%)]"
              : "bg-[radial-gradient(80%_120%_at_0%_0%,oklch(1_0_0/0.03),transparent_60%)]"
          )}
        />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl border",
                hasStreak
                  ? "border-mastered/30 bg-mastered/10"
                  : "border-border/60 bg-muted/30"
              )}
            >
              <Flame
                className={cn(
                  "size-5",
                  hasStreak ? "text-mastered" : "text-muted-foreground"
                )}
                strokeWidth={1.5}
              />
            </div>
            <div>
              {hasStreak ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif-display text-3xl font-medium tabular-nums">
                      {current}
                    </span>
                    <span className="text-sm font-medium text-foreground/80">
                      day{current > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {studiedToday
                      ? `Study streak — keep it going! Best: ${best} day${best > 1 ? "s" : ""}.`
                      : `Study streak — answer one more to extend it.`}
                  </p>
                </>
              ) : (
                <>
                  <div className="font-serif-display text-base font-medium">
                    Start a study streak
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Quiz daily to build a streak. Consistency is key.
                  </p>
                </>
              )}
            </div>
            {!hasStreak && (
              <Button
                size="sm"
                variant="outline"
                className="hidden rounded-full sm:inline-flex"
                onClick={() => onNavigate("quiz")}
              >
                <Target className="size-3.5" strokeWidth={1.75} />
                Take a quiz
              </Button>
            )}
          </div>
          {/* Week dots + freezes */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                // Show last 7 days; today is the last dot.
                const active = hasStreak && i >= 7 - current;
                const isToday = i === 6;
                return (
                  <div
                    key={i}
                    title={isToday ? "Today" : `Day ${i + 1}`}
                    className={cn(
                      "size-2.5 rounded-full transition-colors",
                      active
                        ? "bg-mastered"
                        : isToday && studiedToday
                        ? "bg-mastered"
                        : "bg-foreground/10"
                    )}
                  />
                );
              })}
            </div>
            {freezesAvailable > 0 && (
              <div
                className="flex items-center gap-1 rounded-full border border-learning/30 bg-learning/5 px-2 py-0.5 text-[10px] text-learning"
                title={`${freezesLeft} streak freeze${freezesLeft !== 1 ? "s" : ""} available — forgives one missed day each`}
              >
                <Sparkles className="size-2.5" strokeWidth={2} />
                <span className="tabular-nums">{freezesLeft}</span>
                <span className="hidden sm:inline">freeze{freezesLeft !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  delay = 0,
}: {
  icon: typeof Award;
  label: string;
  value: string | number;
  hint?: string;
  accent?: "mastered" | "learning";
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="gap-0 p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </span>
          <Icon
            className={cn(
              "size-3.5",
              accent === "mastered" && "text-mastered",
              accent === "learning" && "text-learning",
              !accent && "text-muted-foreground"
            )}
            strokeWidth={1.75}
          />
        </div>
        <div className="mt-3 font-serif-display text-3xl font-medium tracking-tight">
          {value}
        </div>
        {hint && (
          <div className="mt-1 text-xs text-muted-foreground tabular-nums">
            {hint}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function MasteryRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const ratio = total > 0 ? value / total : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {value} · {formatPercent(ratio)}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}
