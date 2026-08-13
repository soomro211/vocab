"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  BookMarked,
  Shuffle,
  Eye,
  Target,
  Volume2,
} from "lucide-react";
import { useVocabStore, MASTERY_THRESHOLD } from "@/lib/store";
import { shuffle } from "@/lib/stats";
import { CATEGORY_META } from "@/lib/word-data";
import { speak } from "@/lib/tts-client";
import type { Word } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { SpeakButton } from "@/components/speak-button";
import { toast } from "sonner";

type DeckFilter = "all" | "not-mastered" | "learning";

const FILTER_OPTIONS: { key: DeckFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "learning", label: "Learning" },
  { key: "not-mastered", label: "Not mastered" },
];

export function FlashcardView() {
  const activeCategory = useVocabStore((s) => s.activeCategory);
  const getWordsForCategory = useVocabStore((s) => s.getWordsForCategory);
  const progress = useVocabStore((s) => s.progress);
  const settings = useVocabStore((s) => s.settings);
  const setSettings = useVocabStore((s) => s.setSettings);

  const [shuffleKey, setShuffleKey] = useState(0);
  const [shuffled, setShuffled] = useState(false);
  const [filter, setFilter] = useState<DeckFilter>("all");

  const meta = CATEGORY_META[activeCategory];
  const allWords = getWordsForCategory(activeCategory);

  const masteredCount = allWords.filter(
    (w) => progress[w.id]?.status === "mastered"
  ).length;

  const handleShuffle = () => {
    setShuffled(true);
    setShuffleKey((k) => k + 1);
    toast.success("Deck shuffled");
  };

  const filteredWords = allWords.filter((w) => {
    const p = progress[w.id];
    const status = p?.status ?? "new";
    if (filter === "learning") return status === "learning" || status === "new";
    if (filter === "not-mastered") return status !== "mastered";
    return true;
  });

  if (allWords.length === 0) {
    return (
      <EmptyDeck
        title="No words in this list yet"
        description={`Import words to start studying ${meta.label.toLowerCase()}.`}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Flashcards
          </div>
          <h1 className="mt-1 font-serif-display text-2xl font-medium tracking-tight sm:mt-1.5 sm:text-3xl md:text-4xl">
            Study
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={settings.autoPronounce}
            aria-label="Toggle auto-pronounce on reveal"
            onClick={() =>
              setSettings({ autoPronounce: !settings.autoPronounce })
            }
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors",
              settings.autoPronounce
                ? "border-mastered/40 bg-mastered/10 text-mastered"
                : "border-border/70 bg-card/60 text-muted-foreground hover:text-foreground"
            )}
          >
            <Volume2 className="size-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">Auto-say</span>
          </button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={handleShuffle}
          >
            <Shuffle className="size-3.5" strokeWidth={1.75} />
            Shuffle
          </Button>
        </div>
      </header>

      {/* Focus filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-border/70 bg-card/60 p-1 backdrop-blur">
          <Target
            className="ml-1.5 size-3.5 shrink-0 text-muted-foreground"
            strokeWidth={1.75}
          />
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.key;
            const count =
              opt.key === "all"
                ? allWords.length
                : opt.key === "learning"
                ? allWords.filter(
                    (w) =>
                      (progress[w.id]?.status ?? "new") !== "mastered"
                  ).length
                : allWords.filter(
                    (w) => (progress[w.id]?.status ?? "new") !== "mastered"
                  ).length;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFilter(opt.key)}
                className={cn(
                  "relative shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="flash-filter-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
                {opt.label}
                <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-mastered" />
            {masteredCount} mastered
          </span>
        </div>
      </div>

      {filteredWords.length === 0 ? (
        <Card className="gap-0 p-10 text-center">
          <Target
            className="mx-auto size-6 text-muted-foreground/60"
            strokeWidth={1.25}
          />
          <h3 className="mt-3 font-serif-display text-lg font-medium">
            Nothing to study in this filter
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Everything is mastered. Try the &ldquo;All&rdquo; filter to review.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mx-auto mt-4 rounded-full"
            onClick={() => setFilter("all")}
          >
            Show all cards
          </Button>
        </Card>
      ) : (
        <Deck
          key={`${activeCategory}-${shuffleKey}-${filter}`}
          words={shuffled ? shuffle(filteredWords) : filteredWords}
          autoPronounce={settings.autoPronounce}
        />
      )}
    </div>
  );
}

function Deck({
  words,
  autoPronounce,
}: {
  words: Word[];
  autoPronounce: boolean;
}) {
  const toggleLearned = useVocabStore((s) => s.toggleLearned);
  const progress = useVocabStore((s) => s.progress);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  // Auto-pronounce when the card is revealed (flipped to back).
  useEffect(() => {
    if (flipped && autoPronounce && words[index]) {
      speak(words[index].term).catch(() => {});
    }
  }, [flipped, autoPronounce, index, words]);

  const goNext = useCallback(() => {
    setFlipped(false);
    setDirection(1);
    setIndex((i) => (i + 1) % Math.max(words.length, 1));
  }, [words.length]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setDirection(-1);
    setIndex(
      (i) => (i - 1 + Math.max(words.length, 1)) % Math.max(words.length, 1)
    );
  }, [words.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight") {
        goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const word = words[index];
  if (!word) return null;

  const learned = progress[word.id]?.learned ?? false;
  const status = progress[word.id]?.status ?? "new";

  return (
    <>
      {/* Card stage */}
      <div className="perspective-1000 relative h-[20rem] shrink-0 sm:h-[22rem] md:h-[24rem]">
        <AnimatePresence custom={direction} mode="popLayout">
          <Flashcard
            key={word.id}
            word={word}
            flipped={flipped}
            direction={direction}
            onFlip={() => setFlipped((f) => !f)}
          />
        </AnimatePresence>
      </div>

      <div className="text-center text-xs text-muted-foreground tabular-nums">
        Card {index + 1} of {words.length}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 sm:gap-3">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-11 rounded-full"
            onClick={goPrev}
            aria-label="Previous card"
          >
            <ChevronLeft className="size-5" strokeWidth={1.75} />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11 flex-1 rounded-full"
            onClick={() => setFlipped((f) => !f)}
          >
            <RotateCw className="size-4" strokeWidth={1.75} />
            {flipped ? "Show term" : "Reveal definition"}
          </Button>
          <Button
            size="icon"
            className="size-11 rounded-full"
            onClick={goNext}
            aria-label="Next card"
          >
            <ChevronRight className="size-5" strokeWidth={1.75} />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant={learned ? "secondary" : "ghost"}
            size="sm"
            className="rounded-full"
            onClick={() => toggleLearned(word.id)}
          >
            <BookMarked
              className={cn("size-3.5", learned && "fill-current")}
              strokeWidth={1.75}
            />
            {learned ? "Marked learned" : "Mark as learned"}
          </Button>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <SpeakButton term={word.term} />
          </div>
        </div>

        {/* Keyboard hint — clean, subtle */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <kbd className="rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 font-sans text-[10px] text-foreground/70">
            ←
          </kbd>
          <kbd className="rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 font-sans text-[10px] text-foreground/70">
            →
          </kbd>
          <span>navigate</span>
          <span className="mx-1 text-border">·</span>
          <kbd className="rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 font-sans text-[10px] text-foreground/70">
            Space
          </kbd>
          <span>flip</span>
        </div>
      </div>
    </>
  );
}

function Flashcard({
  word,
  flipped,
  direction,
  onFlip,
}: {
  word: Word;
  flipped: boolean;
  direction: number;
  onFlip: () => void;
}) {
  return (
    <motion.div
      className="preserve-3d absolute inset-0 cursor-pointer"
      custom={direction}
      initial={(dir: number) => ({
        opacity: 0,
        x: dir === 0 ? 0 : dir > 0 ? 60 : -60,
        rotateY: flipped ? 180 : 0,
      })}
      animate={{
        opacity: 1,
        x: 0,
        rotateY: flipped ? 180 : 0,
      }}
      exit={(dir: number) => ({
        opacity: 0,
        x: dir > 0 ? -60 : 60,
        transition: { duration: 0.2 },
      })}
      transition={{
        opacity: { duration: 0.25 },
        x: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        rotateY: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
      }}
      onClick={onFlip}
    >
      {/* Front face — term */}
      <Card className="backface-hidden absolute inset-0 flex flex-col overflow-hidden border-border/70 bg-card p-5 shadow-lg sm:p-6">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <span>Term</span>
          <Eye className="size-3.5 text-muted-foreground/50" strokeWidth={1.5} />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <h2 className="font-serif-display text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
            {word.term}
          </h2>
          {word.partOfSpeech && (
            <p className="text-xs italic text-muted-foreground">
              {word.partOfSpeech}
            </p>
          )}
        </div>
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
          Tap to reveal
        </p>
      </Card>

      {/* Back face — definition + example */}
      <Card className="backface-hidden absolute inset-0 flex flex-col overflow-hidden border-border/70 bg-card p-5 shadow-lg [transform:rotateY(180deg)] sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Definition
          </span>
          <SpeakButton term={word.term} />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-3 overflow-y-auto">
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="font-serif-display text-xl font-medium tracking-tight sm:text-2xl">
                {word.term}
              </h3>
              {word.partOfSpeech && (
                <span className="text-[11px] italic text-muted-foreground">
                  {word.partOfSpeech}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/90 text-pretty sm:text-base">
              {word.definition}
            </p>
          </div>
          <div className="border-l-2 border-border/70 pl-3">
            <p className="text-xs italic leading-relaxed text-muted-foreground text-pretty">
              {word.example}
            </p>
          </div>
        </div>
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
          Tap to flip back
        </p>
      </Card>
    </motion.div>
  );
}

function EmptyDeck({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="mx-auto max-w-md gap-0 p-10 text-center">
      <h3 className="font-serif-display text-xl font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}
