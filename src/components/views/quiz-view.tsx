"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  X,
  Flame,
  Trophy,
  RefreshCw,
  ArrowRight,
  Target,
  Sparkles,
  ArrowLeftRight,
  Timer,
  Clock,
  Filter,
  AlertCircle,
} from "lucide-react";
import { useVocabStore, MASTERY_THRESHOLD } from "@/lib/store";
import type { QuizDirection } from "@/lib/store";
import { pickDistractors, shuffle, formatPercent } from "@/lib/stats";
import { CATEGORY_META } from "@/lib/word-data";
import type { TabKey, Word } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SpeakButton } from "@/components/speak-button";
import { toast } from "sonner";

interface QuizQuestion {
  word: Word;
  options: Word[];
  correctId: string;
}

interface AnswerRecord {
  word: Word;
  chosenId: string | null;
  correct: boolean;
  /** Response time in milliseconds. */
  responseMs: number;
}

type Phase = "setup" | "playing" | "results";

/** Which words to draw quiz questions from. */
type QuizSource = "all" | "missed" | "learning";

const LENGTH_OPTIONS = [
  { value: 5, label: "5" },
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: -1, label: "All" },
];

/** Which words to draw quiz questions from. */
type QuizSource = "all" | "missed" | "learning" | "mastered";

/** Seconds allotted per question in timed mode. */
const SECONDS_PER_QUESTION = 12;

const SOURCE_OPTIONS: {
  key: QuizSource;
  label: string;
  desc: string;
}[] = [
  { key: "all", label: "All words", desc: "Random sample from the full list" },
  {
    key: "missed",
    label: "Missed words",
    desc: "Words you've gotten wrong before",
  },
  {
    key: "learning",
    label: "In progress",
    desc: "Words still learning or new",
  },
  {
    key: "mastered",
    label: "Mastered",
    desc: "Review words you've already mastered",
  },
];

interface QuizViewProps {
  onNavigate: (tab: TabKey) => void;
}

export function QuizView({ onNavigate }: QuizViewProps) {
  const activeCategory = useVocabStore((s) => s.activeCategory);
  const getWordsForCategory = useVocabStore((s) => s.getWordsForCategory);
  const answer = useVocabStore((s) => s.answer);
  const progress = useVocabStore((s) => s.progress);
  const quizDirection = useVocabStore((s) => s.quizDirection);
  const setQuizDirection = useVocabStore((s) => s.setQuizDirection);
  const settings = useVocabStore((s) => s.settings);
  const setSettings = useVocabStore((s) => s.setSettings);
  const recordQuizSession = useVocabStore((s) => s.recordQuizSession);

  const meta = CATEGORY_META[activeCategory];
  const pool = getWordsForCategory(activeCategory);

  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [bestSessionStreak, setBestSessionStreak] = useState(0);
  const [timed, setTimed] = useState(settings.quizTimed);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [source, setSource] = useState<QuizSource>("all");
  const questionStartRef = useRef<number>(Date.now());

  // Persist timed preference whenever it changes.
  const handleTimedChange = useCallback(
    (v: boolean) => {
      setTimed(v);
      setSettings({ quizTimed: v });
    },
    [setSettings]
  );

  // Derive the filtered word pool based on the selected source.
  const sourcePool = useMemo(() => {
    if (source === "missed") {
      return pool.filter((w) => {
        const p = progress[w.id];
        return p && p.incorrectCount > 0;
      });
    }
    if (source === "learning") {
      return pool.filter((w) => {
        const p = progress[w.id];
        const status = p?.status ?? "new";
        return status !== "mastered";
      });
    }
    if (source === "mastered") {
      return pool.filter((w) => progress[w.id]?.status === "mastered");
    }
    return pool;
  }, [pool, progress, source]);

  const startQuiz = useCallback(
    (length: number, direction: QuizDirection, timedMode: boolean) => {
      if (sourcePool.length < 4) {
        toast.error(
          source === "missed"
            ? "Not enough missed words yet. Answer some questions first."
            : source === "learning"
            ? "Not enough words in progress. You may have mastered them all!"
            : "Need at least 4 words in this category to build a quiz."
        );
        return;
      }
      const n =
        length === -1 ? sourcePool.length : Math.min(length, sourcePool.length);
      const sampled = shuffle(sourcePool).slice(0, n);
      const built: QuizQuestion[] = sampled.map((word) => {
        const distractors = pickDistractors(pool, word, 3);
        const options = shuffle([word, ...distractors]);
        return { word, options, correctId: word.id };
      });
      const total = timedMode ? built.length * SECONDS_PER_QUESTION : 0;
      setQuestions(built);
      setCurrent(0);
      setSelected(null);
      setRevealed(false);
      setRecords([]);
      setSessionStreak(0);
      setBestSessionStreak(0);
      setTimed(timedMode);
      setTotalTime(total);
      setTimeLeft(total);
      setPhase("playing");
    },
    [sourcePool, pool, source]
  );

  // Countdown timer for timed mode (defined after finishQuiz).
  // — actual effect is below.

  const question = questions[current];

  const pick = useCallback(
    (optionId: string) => {
      if (revealed || !question) return;
      const correct = optionId === question.correctId;
      const responseMs = Date.now() - questionStartRef.current;
      setSelected(optionId);
      setRevealed(true);
      answer(question.word.id, correct);
      setRecords((r) => [
        ...r,
        { word: question.word, chosenId: optionId, correct, responseMs },
      ]);
      if (correct) {
        setSessionStreak((s) => {
          const next = s + 1;
          setBestSessionStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        setSessionStreak(0);
      }
    },
    [revealed, question, answer]
  );

  // Record the session and transition to results.
  const finishQuiz = useCallback(() => {
    const correctCount = records.filter((r) => r.correct).length;
    recordQuizSession({
      total: questions.length,
      correct: correctCount,
      perfect: questions.length > 0 && correctCount === questions.length,
      timed,
    });
    setPhase("results");
  }, [records, questions.length, timed, recordQuizSession]);

  const next = useCallback(() => {
    if (current + 1 >= questions.length) {
      finishQuiz();
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setRevealed(false);
    questionStartRef.current = Date.now();
  }, [current, questions.length, finishQuiz]);

  // Countdown timer for timed mode.
  useEffect(() => {
    if (phase !== "playing" || !timed) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          finishQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, timed, finishQuiz]);

  // Keyboard: 1-4 to select, Enter/Space to advance
  useEffect(() => {
    if (phase !== "playing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (["1", "2", "3", "4"].includes(e.key) && !revealed && question) {
        const idx = Number(e.key) - 1;
        if (question.options[idx]) pick(question.options[idx].id);
      } else if ((e.key === "Enter" || e.key === " ") && revealed) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, revealed, question, pick, next]);

  const isDefToTerm = quizDirection === "def-to-term";

  if (phase === "setup") {
    return (
      <QuizSetup
        metaLabel={meta.label}
        metaDescription={meta.description}
        totalWords={pool.length}
        masteredCount={
          pool.filter((w) => progress[w.id]?.status === "mastered").length
        }
        direction={quizDirection}
        onDirectionChange={setQuizDirection}
        timed={timed}
        onTimedChange={handleTimedChange}
        defaultLength={settings.quizLength}
        onLengthChange={(l) => setSettings({ quizLength: l })}
        source={source}
        onSourceChange={setSource}
        sourcePoolCount={sourcePool.length}
        onStart={(length) => startQuiz(length, quizDirection, timed)}
      />
    );
  }

  if (phase === "results") {
    const correctCount = records.filter((r) => r.correct).length;
    return (
      <QuizResults
        records={records}
        correctCount={correctCount}
        total={questions.length}
        bestStreak={bestSessionStreak}
        timed={timed}
        timeUsed={Math.max(0, totalTime - timeLeft)}
        totalTime={totalTime}
        timedOut={timed && timeLeft <= 0}
        onRestart={() => setPhase("setup")}
        onNavigate={onNavigate}
        progressMap={progress}
      />
    );
  }

  if (!question) return null;

  const answered = records.length;
  const progressPct = (answered / questions.length) * 100;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-13rem)] max-w-2xl flex-col gap-4 sm:gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Quiz · {meta.label}
          </div>
          <h1 className="mt-1 font-serif-display text-2xl font-medium tracking-tight sm:mt-1.5 sm:text-3xl md:text-4xl">
            Multiple choice
          </h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {timed && <TimerPill seconds={timeLeft} total={totalTime} />}
          <StreakPill streak={sessionStreak} best={bestSessionStreak} />
        </div>
      </header>

      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular-nums">
            Question {current + 1} of {questions.length}
          </span>
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <ArrowLeftRight className="size-3" strokeWidth={1.75} />
            {isDefToTerm ? "Def → Term" : "Term → Def"}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/15">
          <motion.div
            className="h-full rounded-full bg-foreground/80"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.word.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-1 flex-col gap-3 sm:gap-5"
        >
          {/* Question card — direction-aware */}
          <Card className="gap-0 p-5 text-center sm:p-8">
            {isDefToTerm ? (
              <>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Which term matches
                </div>
                <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-foreground/90 text-pretty sm:mt-3 sm:text-lg">
                  {question.word.definition}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Which definition matches
                  </div>
                  <SpeakButton term={question.word.term} />
                </div>
                <h2 className="mt-2 font-serif-display text-3xl font-medium tracking-tight sm:mt-3 sm:text-4xl md:text-5xl">
                  {question.word.term}
                </h2>
                {question.word.partOfSpeech && (
                  <p className="mt-1.5 text-xs italic text-muted-foreground sm:mt-2">
                    {question.word.partOfSpeech}
                  </p>
                )}
              </>
            )}
          </Card>

          <div className="grid flex-1 gap-2 sm:gap-2.5">
            {question.options.map((opt, i) => {
              const isCorrect = opt.id === question.correctId;
              const isSelected = selected === opt.id;
              const showCorrect = revealed && isCorrect;
              const showWrong = revealed && isSelected && !isCorrect;
              return (
                <div
                  key={opt.id}
                  role="button"
                  tabIndex={revealed ? -1 : 0}
                  aria-disabled={revealed}
                  aria-label={`Option ${i + 1}: ${
                    isDefToTerm ? opt.term : opt.definition
                  }`}
                  onClick={() => pick(opt.id)}
                  onKeyDown={(e) => {
                    if (
                      !revealed &&
                      (e.key === "Enter" || e.key === " ")
                    ) {
                      e.preventDefault();
                      pick(opt.id);
                    }
                  }}
                  className={cn(
                    "group flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all sm:px-4 sm:py-3.5",
                    revealed && "cursor-default",
                    !revealed &&
                      "border-border/70 bg-card/60 hover:border-foreground/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                    showCorrect && "border-mastered/50 bg-mastered/10",
                    showWrong && "border-destructive/50 bg-destructive/10",
                    revealed &&
                      !showCorrect &&
                      !showWrong &&
                      "border-border/50 bg-card/40 opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-colors",
                      !revealed &&
                        "border-border/70 text-muted-foreground group-hover:text-foreground",
                      showCorrect &&
                        "border-mastered/40 bg-mastered/15 text-mastered",
                      showWrong &&
                        "border-destructive/40 bg-destructive/15 text-destructive",
                      revealed &&
                        !showCorrect &&
                        !showWrong &&
                        "border-border/50 text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-foreground/90 text-pretty">
                    {isDefToTerm ? opt.term : opt.definition}
                  </span>
                  {isDefToTerm && revealed && (
                    <SpeakButton
                      term={opt.term}
                      size="icon"
                      className="size-6 border-0"
                    />
                  )}
                  {showCorrect && (
                    <Check
                      className="size-4 shrink-0 text-mastered"
                      strokeWidth={2.5}
                    />
                  )}
                  {showWrong && (
                    <X
                      className="size-4 shrink-0 text-destructive"
                      strokeWidth={2.5}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-auto flex flex-col gap-2 pt-2 sm:gap-3 sm:pt-0"
          >
            <FeedbackBanner
              correct={selected === question.correctId}
              word={question.word}
              currentStreak={
                progress[question.word.id]?.currentStreak ?? 0
              }
              showTerm={isDefToTerm}
            />
            <Button
              size="lg"
              className="h-12 rounded-full"
              onClick={next}
            >
              {current + 1 >= questions.length
                ? "See results"
                : "Next question"}
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StreakPill({ streak, best }: { streak: number; best: number }) {
  const onFire = streak >= MASTERY_THRESHOLD;
  const dots = Array.from({ length: MASTERY_THRESHOLD }, (_, i) => i < streak);
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs transition-colors",
        onFire
          ? "border-mastered/40 bg-mastered/10 text-mastered"
          : streak > 0
          ? "border-learning/40 bg-learning/10 text-learning"
          : "border-border/70 bg-card/60 text-muted-foreground"
      )}
      title={`Current streak: ${streak} · Best: ${best}`}
    >
      <Flame
        className={cn(
          "size-3.5",
          streak > 0 && (onFire ? "fill-mastered/30" : "fill-learning/20"),
          onFire && "animate-pulse"
        )}
        strokeWidth={1.75}
      />
      <span className="font-semibold tabular-nums">{streak}</span>
      {/* Mini mastery progress dots */}
      <span className="hidden items-center gap-0.5 sm:flex">
        {dots.map((lit, i) => (
          <span
            key={i}
            className={cn(
              "size-1 rounded-full transition-colors",
              lit
                ? onFire
                  ? "bg-mastered"
                  : "bg-learning"
                : "bg-current opacity-20"
            )}
          />
        ))}
      </span>
      <span className="text-muted-foreground">/ {best}</span>
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function TimerPill({ seconds, total }: { seconds: number; total: number }) {
  const isUrgent = seconds <= 10;
  const isCritical = seconds <= 5;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs tabular-nums transition-colors",
        isCritical
          ? "border-destructive/50 bg-destructive/10 text-destructive"
          : isUrgent
          ? "border-learning/50 bg-learning/10 text-learning"
          : "border-border/70 bg-card/60 text-muted-foreground"
      )}
      title={`${formatTime(seconds)} remaining of ${formatTime(total)}`}
    >
      <Timer
        className={cn("size-3.5", isCritical && "animate-pulse")}
        strokeWidth={1.75}
      />
      <span className="font-semibold">{formatTime(seconds)}</span>
      {isUrgent && <span className="text-[10px] opacity-80">hurry!</span>}
    </div>
  );
}

function FeedbackBanner({
  correct,
  word,
  currentStreak,
  showTerm,
}: {
  correct: boolean;
  word: Word;
  currentStreak: number;
  showTerm?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3 sm:gap-3 sm:p-4",
        correct
          ? "border-mastered/30 bg-mastered/5"
          : "border-destructive/30 bg-destructive/5"
      )}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full sm:size-8",
          correct
            ? "bg-mastered/15 text-mastered"
            : "bg-destructive/15 text-destructive"
        )}
      >
        {correct ? (
          <Check className="size-3.5 sm:size-4" strokeWidth={2.5} />
        ) : (
          <X className="size-3.5 sm:size-4" strokeWidth={2.5} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          {correct ? "Correct" : "Not quite"}
          {correct && currentStreak >= MASTERY_THRESHOLD && (
            <span className="inline-flex items-center gap-1 text-mastered">
              <Sparkles className="size-3" /> Mastered!
            </span>
          )}
          <SpeakButton term={word.term} size="icon" className="size-5 border-0" />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground text-pretty sm:mt-1">
          <span className="font-serif-display text-sm italic text-foreground/80">
            {word.term}
          </span>{" "}
          — {word.definition}
        </p>
        {correct && (
          <p className="mt-0.5 text-[11px] text-muted-foreground sm:mt-1">
            Streak: {currentStreak}/{MASTERY_THRESHOLD} toward mastery
          </p>
        )}
      </div>
    </div>
  );
}

function QuizSetup({
  metaLabel,
  metaDescription,
  totalWords,
  masteredCount,
  direction,
  onDirectionChange,
  timed,
  onTimedChange,
  defaultLength,
  onLengthChange,
  source,
  onSourceChange,
  sourcePoolCount,
  onStart,
}: {
  metaLabel: string;
  metaDescription: string;
  totalWords: number;
  masteredCount: number;
  direction: QuizDirection;
  onDirectionChange: (dir: QuizDirection) => void;
  timed: boolean;
  onTimedChange: (v: boolean) => void;
  defaultLength: number;
  onLengthChange: (l: number) => void;
  source: QuizSource;
  onSourceChange: (s: QuizSource) => void;
  sourcePoolCount: number;
  onStart: (length: number) => void;
}) {
  const [length, setLength] = useState(defaultLength);
  const canStart = sourcePoolCount >= 4;
  const estimatedTime =
    (length === -1
      ? sourcePoolCount
      : Math.min(length, sourcePoolCount)) * SECONDS_PER_QUESTION;

  const handleLengthChange = (l: number) => {
    setLength(l);
    onLengthChange(l);
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 sm:gap-6">
      <header>
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Quiz
        </div>
        <h1 className="mt-1 font-serif-display text-2xl font-medium tracking-tight sm:mt-1.5 sm:text-3xl md:text-4xl">
          Test your knowledge
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground text-pretty sm:mt-2">
          {metaLabel} · {metaDescription}
        </p>
      </header>

      <Card className="gap-0 p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Words" value={totalWords} />
          <Stat label="Mastered" value={masteredCount} accent="mastered" />
          <Stat
            label="To master"
            value={Math.max(totalWords - masteredCount, 0)}
            accent="learning"
          />
        </div>
      </Card>

      {/* Word source */}
      <Card className="gap-0 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold">Word source</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose which words to practice.
        </p>
        <div className="mt-3 sm:mt-4 space-y-2">
          {SOURCE_OPTIONS.map((opt) => {
            const isActive = source === opt.key;
            const count =
              opt.key === "all"
                ? totalWords
                : opt.key === "missed"
                ? sourcePoolCount
                : sourcePoolCount;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onSourceChange(opt.key)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all sm:p-3.5",
                  isActive
                    ? "border-foreground/40 bg-foreground/5"
                    : "border-border/70 hover:text-foreground"
                )}
              >
                <div className="min-w-0">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {opt.label}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {opt.desc}
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
                    isActive
                      ? "bg-foreground/10 text-foreground"
                      : "bg-muted/40 text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {!canStart && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-learning/30 bg-learning/5 px-4 py-2.5 text-xs text-learning">
            <AlertCircle className="size-3.5 shrink-0" strokeWidth={1.75} />
            {source === "missed"
              ? "You need at least 4 missed words. Take a quiz first!"
              : source === "learning"
              ? "Not enough words in progress — you may have mastered them all."
              : "Need at least 4 words to start."}
          </div>
        )}
      </Card>

      {/* Direction toggle */}
      <Card className="gap-0 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <ArrowLeftRight
            className="size-4 text-muted-foreground"
            strokeWidth={1.75}
          />
          <h2 className="text-sm font-semibold">Direction</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose how questions are presented.
        </p>
        <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2">
          {(
            [
              {
                key: "term-to-def",
                title: "Term → Definition",
                desc: "See the word, pick its meaning",
              },
              {
                key: "def-to-term",
                title: "Definition → Term",
                desc: "See the meaning, pick the word",
              },
            ] as const
          ).map((opt) => {
            const isActive = direction === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onDirectionChange(opt.key)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all sm:p-4",
                  isActive
                    ? "border-foreground/40 bg-foreground/5"
                    : "border-border/70 hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {opt.title}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="gap-0 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold">Number of questions</h2>
        </div>
        <div className="mt-3 sm:mt-4 grid grid-cols-4 gap-2">
          {LENGTH_OPTIONS.map((opt) => {
            const isActive = length === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleLengthChange(opt.value)}
                className={cn(
                  "rounded-xl border py-3 text-sm font-medium transition-all sm:py-4",
                  isActive
                    ? "border-foreground/40 bg-foreground/5 text-foreground"
                    : "border-border/70 text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 sm:mt-4 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <Flame
            className="size-3.5 shrink-0 text-learning"
            strokeWidth={1.75}
          />
          Answer correctly {MASTERY_THRESHOLD} times in a row to master a word.
          One miss resets its streak.
        </div>
      </Card>

      {/* Timed mode toggle */}
      <Card className="gap-0 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-2">
            <Clock
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              strokeWidth={1.75}
            />
            <div>
              <h2 className="text-sm font-semibold">Timed mode</h2>
              <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
                Race against the clock. {SECONDS_PER_QUESTION}s per question —
                the quiz ends when time runs out.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={timed}
            aria-label="Toggle timed mode"
            onClick={() => onTimedChange(!timed)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
              timed
                ? "border-foreground/30 bg-foreground/20"
                : "border-border/70 bg-muted/60"
            )}
          >
            <span
              className={cn(
                "inline-block size-4 transform rounded-full bg-foreground shadow-sm transition-transform",
                timed ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
        {timed && (
          <div className="mt-3 sm:mt-4 flex items-center gap-2 rounded-lg border border-learning/30 bg-learning/5 px-4 py-3 text-xs text-learning">
            <Timer className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span className="tabular-nums">
              {formatTime(estimatedTime)} total for this quiz
            </span>
          </div>
        )}
      </Card>

      <Button
        size="lg"
        className="h-12 rounded-full"
        onClick={() => onStart(length)}
        disabled={!canStart}
      >
        Start quiz{timed ? " · timed" : ""}
        <ArrowRight className="size-4" strokeWidth={1.75} />
      </Button>
      {!canStart && (
        <p className="text-center text-xs text-muted-foreground">
          {source === "missed"
            ? "Take a quiz first to build your missed-words pool."
            : source === "learning"
            ? "You've mastered almost everything — try the All source."
            : "You need at least 4 words in this category to start a quiz."}
        </p>
      )}
    </div>
  );
}

function QuizResults({
  records,
  correctCount,
  total,
  bestStreak,
  timed,
  timeUsed,
  totalTime,
  timedOut,
  onRestart,
  onNavigate,
  progressMap,
}: {
  records: AnswerRecord[];
  correctCount: number;
  total: number;
  bestStreak: number;
  timed: boolean;
  timeUsed: number;
  totalTime: number;
  timedOut: boolean;
  onRestart: () => void;
  onNavigate: (tab: TabKey) => void;
  progressMap: ReturnType<typeof useVocabStore.getState>["progress"];
}) {
  const accuracy = total > 0 ? correctCount / total : 0;
  const masteredThisSession = records.filter(
    (r) => progressMap[r.word.id]?.status === "mastered"
  ).length;
  const avgResponseMs =
    records.length > 0
      ? Math.round(
          records.reduce((a, r) => a + r.responseMs, 0) / records.length
        )
      : 0;
  const fastestMs =
    records.length > 0 ? Math.min(...records.map((r) => r.responseMs)) : 0;

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="gap-0 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-mastered/30 bg-mastered/10">
            <Trophy className="size-6 text-mastered" strokeWidth={1.5} />
          </div>
          <h1 className="mt-3 sm:mt-4 font-serif-display text-4xl font-medium tracking-tight">
            {formatPercent(accuracy)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {correctCount} of {total} correct
            {timedOut && " · time's up!"}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border/60 pt-6">
            <Stat label="Correct" value={correctCount} accent="mastered" />
            <Stat label="Best streak" value={bestStreak} accent="learning" />
            {timed ? (
              <Stat
                label="Time"
                value={formatTime(timeUsed)}
                accent="mastered"
              />
            ) : (
              <Stat
                label="Newly mastered"
                value={masteredThisSession}
                accent="mastered"
              />
            )}
          </div>
          {timed && (
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3" strokeWidth={1.75} />
              <span className="tabular-nums">
                {formatTime(timeUsed)} used of {formatTime(totalTime)}
              </span>
            </div>
          )}
          {records.length > 0 && (
            <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Timer className="size-3" strokeWidth={1.75} />
                Avg {formatMs(avgResponseMs)}
              </span>
              <span className="text-border">·</span>
              <span>Fastest {formatMs(fastestMs)}</span>
            </div>
          )}
        </Card>
      </motion.div>

      <Card className="gap-0 p-4 sm:p-6">
        <h2 className="text-sm font-semibold">Review</h2>
        <div className="mt-3 max-h-80 space-y-1 overflow-y-auto pr-1">
          {records.map((r, i) => (
            <div
              key={`${r.word.id}-${i}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2"
            >
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  r.correct
                    ? "bg-mastered/15 text-mastered"
                    : "bg-destructive/15 text-destructive"
                )}
              >
                {r.correct ? (
                  <Check className="size-3.5" strokeWidth={2.5} />
                ) : (
                  <X className="size-3.5" strokeWidth={2.5} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif-display text-sm font-medium">
                    {r.word.term}
                  </span>
                  <SpeakButton term={r.word.term} size="icon" className="size-5 border-0" />
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {r.word.definition}
                </div>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                {r.responseMs < 1000
                  ? `${r.responseMs}ms`
                  : `${(r.responseMs / 1000).toFixed(1)}s`}
              </span>
              <span className="w-8 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
                {progressMap[r.word.id]?.currentStreak ?? 0}/{MASTERY_THRESHOLD}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          variant="outline"
          className="h-12 rounded-full"
          onClick={onRestart}
        >
          <RefreshCw className="size-4" strokeWidth={1.75} />
          New quiz
        </Button>
        <Button
          size="lg"
          className="h-12 flex-1 rounded-full"
          onClick={() => onNavigate("dashboard")}
        >
          View dashboard
          <ArrowRight className="size-4" strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "mastered" | "learning";
}) {
  return (
    <div>
      <div
        className={cn(
          "font-serif-display text-2xl font-medium tracking-tight",
          accent === "mastered" && "text-mastered",
          accent === "learning" && "text-learning",
          !accent && "text-foreground"
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
