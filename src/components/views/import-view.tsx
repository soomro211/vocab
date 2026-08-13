"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Braces,
  ListPlus,
  Download,
  DatabaseBackup,
} from "lucide-react";
import { useVocabStore } from "@/lib/store";
import { CATEGORY_META } from "@/lib/word-data";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CategorySwitcher } from "@/components/category-switcher";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ParsedWord {
  term: string;
  definition: string;
  example?: string;
  partOfSpeech?: string;
  ok: boolean;
  error?: string;
}

const SAMPLE = `# One word per line. Use | to separate fields:
# term | definition | example
ephemeral | Lasting for a very short time | Fame on social media is often ephemeral.
serene | Calm and untroubled | The lake was serene at dawn.`;

function parseInput(raw: string): ParsedWord[] {
  const text = raw.trim();
  if (!text) return [];

  // Try JSON first
  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      return arr.map((item: Record<string, unknown>) => {
        const term = String(item.term ?? item.word ?? "").trim();
        const definition = String(item.definition ?? item.meaning ?? "").trim();
        const example = item.example ? String(item.example).trim() : undefined;
        const partOfSpeech = item.partOfSpeech
          ? String(item.partOfSpeech).trim()
          : undefined;
        if (!term || !definition) {
          return {
            term: term || "(empty)",
            definition: definition || "(empty)",
            example,
            partOfSpeech,
            ok: false,
            error: "Missing term or definition",
          };
        }
        return { term, definition, example, partOfSpeech, ok: true };
      });
    } catch {
      return [
        {
          term: "",
          definition: "",
          ok: false,
          error: "Invalid JSON. Check syntax or switch to line mode.",
        },
      ];
    }
  }

  // Line mode: term | definition [| example [| partOfSpeech]]
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  return lines.map((line) => {
    // Split on | or — or : (first occurrence only for the separator approach)
    // We support | primarily; fall back to " - " if no pipe.
    let parts: string[];
    if (line.includes("|")) {
      parts = line.split("|").map((p) => p.trim());
    } else if (line.includes(" — ")) {
      parts = line.split("—").map((p) => p.trim());
    } else if (line.includes(" - ")) {
      parts = line.split(" - ").map((p) => p.trim());
    } else {
      return {
        term: line,
        definition: "",
        ok: false,
        error: "No definition found. Use 'term | definition'.",
      };
    }
    const [term, definition, example, partOfSpeech] = parts;
    if (!term || !definition) {
      return {
        term: term || "(empty)",
        definition: definition || "(empty)",
        example,
        partOfSpeech,
        ok: false,
        error: "Missing term or definition",
      };
    }
    return { term, definition, example, partOfSpeech, ok: true };
  });
}

export function ImportView() {
  const activeCategory = useVocabStore((s) => s.activeCategory);
  const imports = useVocabStore((s) => s.imports);
  const importWords = useVocabStore((s) => s.importWords);
  const removeImport = useVocabStore((s) => s.removeImport);
  const exportProgress = useVocabStore((s) => s.exportProgress);
  const importProgress = useVocabStore((s) => s.importProgress);
  const progressMap = useVocabStore((s) => s.progress);
  const activity = useVocabStore((s) => s.activity);

  const [raw, setRaw] = useState("");
  const parsed = useMemo(() => parseInput(raw), [raw]);
  const validCount = parsed.filter((p) => p.ok).length;

  const handleImport = (category: Category) => {
    const valid = parsed.filter((p) => p.ok);
    if (valid.length === 0) {
      toast.error("Nothing to import", {
        description: "Add at least one valid 'term | definition' line.",
      });
      return;
    }
    importWords(
      category,
      valid.map((p) => ({
        term: p.term,
        definition: p.definition,
        example: p.example ?? "",
        partOfSpeech: p.partOfSpeech,
      }))
    );
    toast.success(`Imported ${valid.length} word${valid.length > 1 ? "s" : ""}`, {
      description: `Added to ${CATEGORY_META[category].label}.`,
    });
    setRaw("");
  };

  const handleExport = () => {
    const json = exportProgress();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `lexicon-progress-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Progress exported", {
      description: "Your backup file has been downloaded.",
    });
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const result = importProgress(text);
      if (result.ok) {
        toast.success("Progress restored", {
          description: "Your saved progress has been loaded.",
        });
      } else {
        toast.error("Could not restore", {
          description: result.error ?? "Invalid backup file.",
        });
      }
    };
    reader.onerror = () => toast.error("Could not read the file");
    reader.readAsText(file);
  };

  const trackedWords = Object.keys(progressMap).length;
  const totalAnswers = activity.length;

  const existingForCategory = imports.filter(
    (i) => i.category === activeCategory
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Import
        </div>
        <h1 className="mt-1.5 font-serif-display text-3xl font-medium tracking-tight md:text-4xl">
          Add your own word lists
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground text-pretty">
          Paste words as plain text or JSON. They&apos;ll be added to the
          selected category and join the same flashcard & quiz flows.
        </p>
      </header>

      <Card className="gap-0 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Target category:</span>
            <CategorySwitcher />
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setRaw(SAMPLE)}
            >
              <FileText className="size-3.5" strokeWidth={1.75} />
              Load sample
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setRaw("")}
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="gap-0 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListPlus className="size-4 text-muted-foreground" strokeWidth={1.75} />
              <h2 className="text-sm font-semibold">Your words</h2>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Plain text or JSON
            </span>
          </div>
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={SAMPLE}
            className="h-72 resize-none rounded-xl border-border/70 bg-muted/30 font-mono text-xs leading-relaxed placeholder:text-muted-foreground/60"
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Braces className="size-3" />
                {raw.startsWith("[") || raw.startsWith("{") ? "JSON" : "Line mode"}
              </span>
              <span className="tabular-nums">
                {validCount}/{parsed.length} valid
              </span>
            </div>
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => handleImport(activeCategory)}
              disabled={validCount === 0}
            >
              <Upload className="size-3.5" strokeWidth={1.75} />
              Import to {CATEGORY_META[activeCategory].label}
            </Button>
          </div>
        </Card>

        <Card className="gap-0 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Preview</h2>
            <span className="text-[11px] text-muted-foreground">
              {parsed.length === 0 ? "Empty" : `${parsed.length} parsed`}
            </span>
          </div>
          <div className="h-72 space-y-1.5 overflow-y-auto pr-1">
            {parsed.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <FileText
                  className="size-6 text-muted-foreground/50"
                  strokeWidth={1.25}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Your parsed words will appear here.
                </p>
              </div>
            )}
            {parsed.map((p, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-lg border px-3 py-2",
                  p.ok
                    ? "border-border/60 bg-muted/20"
                    : "border-destructive/40 bg-destructive/5"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif-display text-sm font-medium">
                    {p.term || "—"}
                  </span>
                  {p.ok ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-mastered" strokeWidth={1.75} />
                  ) : (
                    <AlertCircle className="size-3.5 shrink-0 text-destructive" strokeWidth={1.75} />
                  )}
                </div>
                {p.definition && (
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                    {p.definition}
                  </p>
                )}
                {p.error && (
                  <p className="mt-0.5 text-[10px] text-destructive">{p.error}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="gap-0 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Imported in {CATEGORY_META[activeCategory].label}
          </h2>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {existingForCategory.reduce((a, i) => a + i.words.length, 0)} words
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {existingForCategory.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-xs text-muted-foreground">
              No custom imports yet for this category.
            </div>
          )}
          {existingForCategory.map((imp, idx) => (
            <motion.div
              key={imp.createdAt}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  Import #{idx + 1}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {imp.words.length} words ·{" "}
                  {new Date(imp.createdAt).toLocaleString()}
                </div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground">
                  {imp.words.slice(0, 6).map((w) => w.term).join(", ")}
                  {imp.words.length > 6 && ` +${imp.words.length - 6} more`}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => {
                  removeImport(imp.category, idx);
                  toast.success("Import removed");
                }}
                aria-label="Remove import"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
              </Button>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Backup & restore */}
      <Card className="gap-0 p-6">
        <div className="flex items-center gap-2">
          <DatabaseBackup
            className="size-4 text-muted-foreground"
            strokeWidth={1.75}
          />
          <h2 className="text-sm font-semibold">Backup &amp; restore</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Export your progress (mastery, streaks, imports) as a JSON file, or
          restore from a previous backup.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-center">
          <div>
            <div className="font-serif-display text-xl font-medium tabular-nums">
              {trackedWords}
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Tracked words
            </div>
          </div>
          <div>
            <div className="font-serif-display text-xl font-medium tabular-nums">
              {totalAnswers}
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Answers logged
            </div>
          </div>
          <div>
            <div className="font-serif-display text-xl font-medium tabular-nums">
              {imports.reduce((a, i) => a + i.words.length, 0)}
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Custom words
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={handleExport}
          >
            <Download className="size-4" strokeWidth={1.75} />
            Export progress
          </Button>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground shadow-xs transition-colors hover:bg-secondary/80">
                  <DatabaseBackup className="size-4" strokeWidth={1.75} />
                  Restore from file
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleRestore(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent>
                Load a previously exported backup JSON
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground/70">
          Restoring replaces your current progress. Export first if you want to
          keep a snapshot.
        </p>
      </Card>
    </div>
  );
}
