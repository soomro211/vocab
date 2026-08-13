import { BookText } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <BookText className="size-3.5" strokeWidth={1.5} />
          <span className="font-serif-display text-sm text-foreground/80">
            Lexicon
          </span>
          <span className="text-muted-foreground/70">·</span>
          <span>A focused SAT vocabulary trainer.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground/70">
            Progress saved locally
          </span>
          <span className="text-muted-foreground/70">·</span>
          <span>3 correct in a row → mastered</span>
        </div>
      </div>
    </footer>
  );
}
