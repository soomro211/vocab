"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { QuizHistoryView } from "@/components/views/quiz-history-view";
import type { TabKey } from "@/lib/types";

interface QuizHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (tab: TabKey) => void;
}

export function QuizHistoryDialog({
  open,
  onOpenChange,
  onNavigate,
}: QuizHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto border-border/70 bg-card p-0 sm:max-w-2xl">
        <DialogHeader className="sticky top-0 z-10 border-b border-border/60 bg-card/95 px-6 py-4 backdrop-blur">
          <DialogTitle className="font-serif-display text-lg">
            Quiz History
          </DialogTitle>
          <DialogDescription className="text-xs">
            Your past quiz sessions and accuracy trends.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-6">
          <QuizHistoryView
            onNavigate={(tab) => {
              onOpenChange(false);
              onNavigate(tab);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
