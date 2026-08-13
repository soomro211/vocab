"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Volume2,
  Timer,
  Target,
  Globe,
  RotateCcw,
  Download,
  Upload,
} from "lucide-react";
import { useVocabStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUIZ_LENGTH_OPTIONS = [5, 10, 20, -1];
const DAILY_GOAL_OPTIONS = [5, 10, 20, 30];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const settings = useVocabStore((s) => s.settings);
  const setSettings = useVocabStore((s) => s.setSettings);
  const resetAll = useVocabStore((s) => s.resetAll);
  const exportProgress = useVocabStore((s) => s.exportProgress);
  const importProgress = useVocabStore((s) => s.importProgress);

  const [confirmReset, setConfirmReset] = useState(false);

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
    toast.success("Progress exported");
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const result = importProgress(text);
      if (result.ok) {
        toast.success("Progress restored");
      } else {
        toast.error("Could not restore", {
          description: result.error ?? "Invalid backup file.",
        });
      }
    };
    reader.onerror = () => toast.error("Could not read the file");
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto border-border/70 bg-card p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <DialogTitle className="flex items-center gap-2 font-serif-display text-xl">
            <SettingsIcon className="size-4 text-muted-foreground" strokeWidth={1.75} />
            Settings
          </DialogTitle>
          <DialogDescription className="text-xs">
            Manage your study preferences and progress data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          {/* Quiz defaults */}
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Quiz defaults
            </h3>
            <div className="mt-3 space-y-4">
              {/* Default length */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Target className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                    Default quiz length
                  </label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {settings.quizLength === -1 ? "All" : settings.quizLength}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {QUIZ_LENGTH_OPTIONS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setSettings({ quizLength: l })}
                      className={cn(
                        "rounded-lg border py-2 text-xs font-medium transition-all",
                        settings.quizLength === l
                          ? "border-foreground/40 bg-foreground/5 text-foreground"
                          : "border-border/70 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {l === -1 ? "All" : l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default timed */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <div>
                    <div className="text-sm font-medium">Timed mode</div>
                    <div className="text-[11px] text-muted-foreground">
                      Start quizzes with a countdown
                    </div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.quizTimed}
                  onChange={(v) => setSettings({ quizTimed: v })}
                  label="Toggle timed mode"
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-border/60" />

          {/* Study preferences */}
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Study preferences
            </h3>
            <div className="mt-3 space-y-4">
              {/* Auto-pronounce */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <div>
                    <div className="text-sm font-medium">Auto-pronounce</div>
                    <div className="text-[11px] text-muted-foreground">
                      Say words aloud when flashcards flip
                    </div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.autoPronounce}
                  onChange={(v) => setSettings({ autoPronounce: v })}
                  label="Toggle auto-pronounce"
                />
              </div>

              {/* Daily goal */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Target className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                    Daily goal
                  </label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {settings.dailyGoal} questions
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {DAILY_GOAL_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSettings({ dailyGoal: g })}
                      className={cn(
                        "rounded-lg border py-2 text-xs font-medium transition-all",
                        settings.dailyGoal === g
                          ? "border-foreground/40 bg-foreground/5 text-foreground"
                          : "border-border/70 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-border/60" />

          {/* Word lists */}
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Pre-made word lists
            </h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              The app ships with 35 Vocabulary and 35 Transition words. Toggle
              them on or off here — your imported words are always kept.
            </p>
            <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">
                    {settings.hideDefaults
                      ? "Pre-made lists hidden"
                      : "Pre-made lists visible"}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {settings.hideDefaults
                      ? "Only your imported words will appear in the word list, flashcards, and quizzes."
                      : "The built-in Vocabulary and Transitions word lists are shown alongside your imports."}
                  </p>
                </div>
                <ToggleSwitch
                  checked={!settings.hideDefaults}
                  onChange={(v) => setSettings({ hideDefaults: !v })}
                  label="Toggle pre-made word lists"
                />
              </div>
            </div>
            {settings.hideDefaults && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-learning/30 bg-learning/5 px-4 py-2.5 text-xs text-learning">
                <Target className="size-3.5 shrink-0" strokeWidth={1.75} />
                Pre-made words are hidden. Import your own words to continue
                studying.
              </div>
            )}
          </section>

          <div className="h-px bg-border/60" />

          {/* Backup & restore */}
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Backup & restore
            </h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Export or import your full progress as a JSON file.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={handleExport}
              >
                <Download className="size-3.5" strokeWidth={1.75} />
                Export progress
              </Button>
              <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-secondary px-4 text-xs font-medium text-secondary-foreground shadow-xs transition-colors hover:bg-secondary/80">
                <Upload className="size-3.5" strokeWidth={1.75} />
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
            </div>
          </section>

          <div className="h-px bg-border/60" />

          {/* Danger zone */}
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-destructive/80">
              Danger zone
            </h3>
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Reset all progress</div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Clears all mastery, streaks, activity, and quiz sessions.
                    Custom imports are kept. This cannot be undone.
                  </p>
                </div>
              </div>
              {confirmReset ? (
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      resetAll();
                      setConfirmReset(false);
                      toast.success("All progress reset");
                    }}
                  >
                    Yes, reset everything
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setConfirmReset(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmReset(true)}
                >
                  <RotateCcw className="size-3.5" strokeWidth={1.75} />
                  Reset progress
                </Button>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
        checked
          ? "border-foreground/30 bg-foreground/20"
          : "border-border/70 bg-muted/60"
      )}
    >
      <span
        className={cn(
          "inline-block size-4 transform rounded-full bg-foreground shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
