"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Filter,
  BookMarked,
  Check,
  RotateCcw,
  Inbox,
  Info,
} from "lucide-react";
import { useVocabStore, MASTERY_THRESHOLD } from "@/lib/store";
import { CATEGORY_META } from "@/lib/word-data";
import { formatPercent } from "@/lib/stats";
import type { TabKey, Word, WordStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { SpeakButton } from "@/components/speak-button";
import { WordDetailDrawer } from "@/components/word-detail-drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type FilterKey = "all" | WordStatus | "learned";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "learning", label: "Learning" },
  { key: "mastered", label: "Mastered" },
  { key: "learned", label: "Learned" },
];

interface WordListViewProps {
  onNavigate: (tab: TabKey) => void;
}

export function WordListView({ onNavigate }: WordListViewProps) {
  const activeCategory = useVocabStore((s) => s.activeCategory);
  const getWordsForCategory = useVocabStore((s) => s.getWordsForCategory);
  const progress = useVocabStore((s) => s.progress);
  const toggleLearned = useVocabStore((s) => s.toggleLearned);
  const resetWord = useVocabStore((s) => s.resetWord);
  // Subscribe to hideDefaults so the list re-renders when it changes.
  const hideDefaults = useVocabStore((s) => s.settings.hideDefaults);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [detailWord, setDetailWord] = useState<Word | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: "/" focuses the search input.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchRef.current) {
        searchRef.current?.blur();
        if (query) setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [query]);

  const meta = CATEGORY_META[activeCategory];
  // hideDefaults is referenced here to trigger re-render when toggled.
  const words = useMemo(
    () => getWordsForCategory(activeCategory),
    [getWordsForCategory, activeCategory, hideDefaults]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      const p = progress[w.id];
      const status = p?.status ?? "new";
      const learned = p?.learned ?? false;
      if (filter === "learned") {
        if (!learned) return false;
      } else if (filter !== "all" && status !== filter) {
        return false;
      }
      if (q) {
        return (
          w.term.toLowerCase().includes(q) ||
          w.definition.toLowerCase().includes(q) ||
          w.example.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [words, progress, query, filter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-2 sm:gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Word List
            </div>
            <h1 className="mt-1 font-serif-display text-2xl font-medium tracking-tight sm:mt-1.5 sm:text-3xl md:text-4xl">
              {meta.label}
            </h1>
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">
            {filtered.length} of {words.length}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
            />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search terms, definitions, examples…"
              className="h-10 rounded-full border-border/70 bg-card/60 pl-9 pr-12 text-sm backdrop-blur"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 font-sans text-[10px] text-foreground/60">
              /
            </kbd>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-border/70 bg-card/60 p-1 backdrop-blur">
            <Filter
              className="ml-1.5 size-3.5 shrink-0 text-muted-foreground"
              strokeWidth={1.75}
            />
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "relative shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.key
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter === f.key && (
                  <motion.span
                    layoutId="word-filter-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {filtered.length === 0 ? (
        <Card className="gap-0 p-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-border/70 bg-muted/40">
              <Inbox className="size-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-sm font-medium">No words match your filters</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Try clearing the search or switching the filter. You can also import
              your own word list.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-full"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((w, i) => (
              <WordCard
                key={w.id}
                word={w}
                index={i}
                progress={progress[w.id]}
                onToggleLearned={() => toggleLearned(w.id)}
                onReset={() => resetWord(w.id)}
                onStudy={() => onNavigate("flashcards")}
                onOpenDetail={() => {
                  setDetailWord(w);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <WordDetailDrawer
        word={detailWord}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}

function WordCard({
  word,
  index,
  progress,
  onToggleLearned,
  onReset,
  onStudy,
  onOpenDetail,
}: {
  word: Word;
  index: number;
  progress: ReturnType<typeof useVocabStore.getState>["progress"][string] | undefined;
  onToggleLearned: () => void;
  onReset: () => void;
  onStudy: () => void;
  onOpenDetail: () => void;
}) {
  const status = progress?.status ?? "new";
  const learned = progress?.learned ?? false;
  const total = progress
    ? progress.correctCount + progress.incorrectCount
    : 0;
  const acc = total > 0 ? progress!.correctCount / total : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.015, 0.2),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Card
        className={cn(
          "group gap-0 p-3.5 transition-colors hover:bg-muted/30 sm:p-5",
          status === "mastered" && "glow-mastered"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenDetail}
                className="font-serif-display text-lg font-medium tracking-tight text-left transition-colors hover:text-foreground/80 sm:text-xl"
                aria-label={`View details for ${word.term}`}
              >
                {word.term}
              </button>
              {word.partOfSpeech && (
                <span className="text-[11px] italic text-muted-foreground">
                  {word.partOfSpeech}
                </span>
              )}
              <SpeakButton term={word.term} size="icon" className="size-6" />
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/90 text-balance">
              {word.definition}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        <p className="mt-3 border-l-2 border-border/70 pl-3 text-xs italic text-muted-foreground">
          &ldquo;{word.example}&rdquo;
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            {total > 0 ? (
              <>
                <span className="tabular-nums">
                  {formatPercent(acc)} accuracy
                </span>
                <span className="tabular-nums">
                  {progress!.currentStreak}/{MASTERY_THRESHOLD} streak
                </span>
              </>
            ) : (
              <span>Not attempted yet</span>
            )}
            {learned && (
              <span className="inline-flex items-center gap-1 text-foreground/70">
                <BookMarked className="size-3" strokeWidth={2} />
                Learned
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onOpenDetail}
                    className="inline-flex size-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="View word details"
                  >
                    <Info className="size-3.5" strokeWidth={1.75} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Details</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onToggleLearned}
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-full border transition-colors",
                      learned
                        ? "border-foreground/20 bg-foreground/10 text-foreground"
                        : "border-border/70 text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={learned ? "Unmark as learned" : "Mark as learned"}
                  >
                    <BookMarked className="size-3.5" strokeWidth={1.75} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {learned ? "Marked as learned" : "Mark as learned"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {progress && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onReset}
                      className="inline-flex size-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Reset this word's progress"
                    >
                      <RotateCcw className="size-3.5" strokeWidth={1.75} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Reset progress</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full px-3 text-xs"
              onClick={onStudy}
            >
              <Check className="size-3.5" strokeWidth={1.75} />
              Study
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
