"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookMarked,
  RotateCcw,
  Target,
  Flame,
  TrendingUp,
  Layers,
  Lightbulb,
  Sparkles,
  Loader2,
  Globe,
  ArrowLeftRight,
} from "lucide-react";
import type { Word, WordProgress } from "@/lib/types";
import { MASTERY_THRESHOLD, useVocabStore } from "@/lib/store";
import { formatPercent } from "@/lib/stats";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge, STATUS_META } from "@/components/status-badge";
import { SpeakButton } from "@/components/speak-button";
import { toast } from "sonner";

interface WordDetailDrawerProps {
  word: Word | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WordDetailDrawer({
  word,
  open,
  onOpenChange,
}: WordDetailDrawerProps) {
  const progress = useVocabStore((s) => (word ? s.progress[word.id] : undefined));
  const toggleLearned = useVocabStore((s) => s.toggleLearned);
  const resetWord = useVocabStore((s) => s.resetWord);

  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [mnemonicLoading, setMnemonicLoading] = useState(false);
  const [etymology, setEtymology] = useState<string | null>(null);
  const [etymologyLoading, setEtymologyLoading] = useState(false);
  const [synonyms, setSynonyms] = useState<string[] | null>(null);
  const [antonyms, setAntonyms] = useState<string[] | null>(null);
  const [synonymsLoading, setSynonymsLoading] = useState(false);

  // Reset all AI-generated content when the word changes.
  useEffect(() => {
    setMnemonic(null);
    setEtymology(null);
    setSynonyms(null);
    setAntonyms(null);
  }, [word?.id]);

  const fetchSynonyms = async () => {
    if (!word || synonymsLoading) return;
    setSynonymsLoading(true);
    try {
      const res = await fetch("/api/synonyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: word.term, definition: word.definition }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSynonyms(data.synonyms ?? []);
      setAntonyms(data.antonyms ?? []);
    } catch {
      toast.error("Couldn't generate synonyms");
    } finally {
      setSynonymsLoading(false);
    }
  };

  const fetchEtymology = async () => {
    if (!word || etymologyLoading) return;
    setEtymologyLoading(true);
    try {
      const res = await fetch("/api/etymology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: word.term }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEtymology(data.etymology);
    } catch {
      toast.error("Couldn't generate etymology");
    } finally {
      setEtymologyLoading(false);
    }
  };

  const fetchMnemonic = async () => {
    if (!word || mnemonicLoading) return;
    setMnemonicLoading(true);
    try {
      const res = await fetch("/api/mnemonic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: word.term,
          definition: word.definition,
          example: word.example,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMnemonic(data.mnemonic);
    } catch {
      toast.error("Couldn't generate a mnemonic");
    } finally {
      setMnemonicLoading(false);
    }
  };

  if (!word) return null;

  const p: WordProgress = progress ?? {
    wordId: word.id,
    status: "new",
    learned: false,
    correctCount: 0,
    incorrectCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastAnsweredAt: null,
  };
  const total = p.correctCount + p.incorrectCount;
  const acc = total > 0 ? p.correctCount / total : 0;
  const meta = STATUS_META[p.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-l border-border/70 bg-card p-0 sm:max-w-md"
      >
        {/* Hero header */}
        <div className="relative overflow-hidden border-b border-border/60 px-6 pb-6 pt-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_100%_at_50%_0%,oklch(1_0_0/0.04),transparent_70%)]"
          />
          <SheetHeader className="relative gap-0 p-0">
            <div className="flex items-center justify-between">
              <SheetDescription className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {word.category === "vocabulary" ? "Vocabulary" : "Transition"}
                {word.imported && " · imported"}
              </SheetDescription>
              <StatusBadge status={p.status} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <SheetTitle className="font-serif-display text-4xl font-medium tracking-tight">
                {word.term}
              </SheetTitle>
              <SpeakButton term={word.term} size="icon" className="size-8" />
            </div>
            {word.partOfSpeech && (
              <SheetDescription className="mt-1.5 flex items-center gap-2 text-xs italic text-muted-foreground">
                {word.partOfSpeech}
              </SheetDescription>
            )}
            {!word.imported && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                  SAT frequency
                </span>
                <FrequencyDots index={parseInt(word.id.split("-").pop() || "0", 10)} />
              </div>
            )}
          </SheetHeader>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {/* Definition */}
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Definition
            </h3>
            <p className="mt-2 text-base leading-relaxed text-foreground/90 text-pretty">
              {word.definition}
            </p>
          </section>

          {/* Example */}
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Example
            </h3>
            <div className="mt-2 rounded-lg border-l-2 border-border/70 bg-muted/20 py-3 pl-4 pr-3">
              <p className="text-sm italic leading-relaxed text-muted-foreground text-pretty">
                &ldquo;{word.example}&rdquo;
              </p>
            </div>
          </section>

          {/* AI Mnemonic */}
          <section>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                <Lightbulb className="size-3" strokeWidth={1.75} />
                Mnemonic
              </h3>
              {!mnemonic && !mnemonicLoading && (
                <button
                  type="button"
                  onClick={fetchMnemonic}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Sparkles className="size-3" strokeWidth={1.75} />
                  Generate
                </button>
              )}
            </div>
            {mnemonicLoading ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
                Thinking of a memory hook…
              </div>
            ) : mnemonic ? (
              <div className="mt-2 rounded-lg border border-learning/20 bg-learning/5 px-4 py-3">
                <p className="text-sm leading-relaxed text-foreground/90 text-pretty">
                  {mnemonic}
                </p>
                <button
                  type="button"
                  onClick={fetchMnemonic}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Sparkles className="size-3" strokeWidth={1.75} />
                  Try another
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground/70">
                Let AI craft a vivid memory hook for this word.
              </p>
            )}
          </section>

          {/* Etymology */}
          <section>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                <Globe className="size-3" strokeWidth={1.75} />
                Etymology
              </h3>
              {!etymology && !etymologyLoading && (
                <button
                  type="button"
                  onClick={fetchEtymology}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Sparkles className="size-3" strokeWidth={1.75} />
                  Generate
                </button>
              )}
            </div>
            {etymologyLoading ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
                Tracing the word's origins…
              </div>
            ) : etymology ? (
              <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                <p className="text-sm leading-relaxed text-foreground/90 text-pretty">
                  {etymology}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground/70">
                Discover where this word comes from.
              </p>
            )}
          </section>

          {/* Synonyms & Antonyms */}
          <section>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                <ArrowLeftRight className="size-3" strokeWidth={1.75} />
                Synonyms &amp; Antonyms
              </h3>
              {synonyms === null && !synonymsLoading && (
                <button
                  type="button"
                  onClick={fetchSynonyms}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Sparkles className="size-3" strokeWidth={1.75} />
                  Generate
                </button>
              )}
            </div>
            {synonymsLoading ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
                Finding related words…
              </div>
            ) : synonyms !== null ? (
              <div className="mt-2 space-y-3">
                {synonyms.length > 0 && (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-mastered/80">
                      Synonyms
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {synonyms.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center rounded-full border border-mastered/20 bg-mastered/5 px-2.5 py-0.5 text-xs text-mastered"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {antonyms && antonyms.length > 0 && (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-destructive/80">
                      Antonyms
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {antonyms.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center rounded-full border border-destructive/20 bg-destructive/5 px-2.5 py-0.5 text-xs text-destructive/90"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {synonyms.length === 0 && (!antonyms || antonyms.length === 0) && (
                  <p className="text-xs text-muted-foreground/70">
                    No related words found.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground/70">
                Explore words with similar and opposite meanings.
              </p>
            )}
          </section>

          {/* Stats grid */}
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Progress
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <DetailStat
                icon={Target}
                label="Accuracy"
                value={total > 0 ? formatPercent(acc) : "—"}
                hint={`${p.correctCount} correct · ${p.incorrectCount} missed`}
                accent={
                  acc >= 0.8 ? "mastered" : acc > 0 ? "learning" : undefined
                }
              />
              <DetailStat
                icon={Flame}
                label="Current streak"
                value={`${p.currentStreak}/${MASTERY_THRESHOLD}`}
                hint={`Best: ${p.bestStreak}`}
                accent={p.currentStreak >= MASTERY_THRESHOLD ? "mastered" : "learning"}
              />
              <DetailStat
                icon={TrendingUp}
                label="Attempts"
                value={total}
                hint={total === 0 ? "Not attempted" : `${p.correctCount}/${total}`}
              />
              <DetailStat
                icon={Layers}
                label="Status"
                value={meta.label}
                hint={p.learned ? "Marked learned" : "Not learned"}
                accent={
                  p.status === "mastered"
                    ? "mastered"
                    : p.status === "learning"
                    ? "learning"
                    : undefined
                }
              />
            </div>
          </section>

          {/* Last answered */}
          {p.lastAnsweredAt && (
            <p className="text-center text-[11px] text-muted-foreground/70">
              Last answered{" "}
              {new Date(p.lastAnsweredAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 border-t border-border/60 px-6 py-4">
          <Button
            variant={p.learned ? "secondary" : "outline"}
            size="sm"
            className="flex-1 rounded-full"
            onClick={() => {
              toggleLearned(word.id);
              toast.success(
                p.learned ? "Unmarked as learned" : "Marked as learned"
              );
            }}
          >
            <BookMarked
              className={cn("size-3.5", p.learned && "fill-current")}
              strokeWidth={1.75}
            />
            {p.learned ? "Learned" : "Mark learned"}
          </Button>
          {total > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-destructive"
              onClick={() => {
                resetWord(word.id);
                toast.success("Progress reset");
              }}
            >
              <RotateCcw className="size-3.5" strokeWidth={1.75} />
              Reset
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FrequencyDots({ index }: { index: number }) {
  // Words earlier in the list are more common on the SAT.
  // 5 dots = very common, 1 dot = less common.
  const tier = index < 7 ? 5 : index < 15 ? 4 : index < 22 ? 3 : index < 30 ? 2 : 1;
  const labels = ["Rare", "Uncommon", "Moderate", "Common", "Very common"];
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "size-1.5 rounded-full",
              i <= tier
                ? tier >= 4
                  ? "bg-mastered"
                  : tier >= 3
                  ? "bg-learning"
                  : "bg-foreground/40"
                : "bg-foreground/10"
            )}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">{labels[tier - 1]}</span>
    </div>
  );
}

function DetailStat({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  hint?: string;
  accent?: "mastered" | "learning";
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center gap-1.5">
        <Icon
          className={cn(
            "size-3",
            accent === "mastered" && "text-mastered",
            accent === "learning" && "text-learning",
            !accent && "text-muted-foreground"
          )}
          strokeWidth={1.75}
        />
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "mt-1.5 font-serif-display text-lg font-medium tabular-nums",
          accent === "mastered" && "text-mastered",
          accent === "learning" && "text-learning",
          !accent && "text-foreground"
        )}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
          {hint}
        </div>
      )}
    </div>
  );
}
