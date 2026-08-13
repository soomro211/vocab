"use client";

import { Check, Loader, Circle, BookMarked } from "lucide-react";
import type { WordStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusMeta {
  label: string;
  icon: typeof Check;
  className: string;
  dotClass: string;
  textClass: string;
}

export const STATUS_META: Record<WordStatus, StatusMeta> = {
  new: {
    label: "New",
    icon: Circle,
    className: "border-border/70 bg-muted/40 text-muted-foreground",
    dotClass: "bg-new",
    textClass: "text-muted-foreground",
  },
  learning: {
    label: "Learning",
    icon: Loader,
    className: "border-learning/30 bg-learning/10 text-learning",
    dotClass: "bg-learning",
    textClass: "text-learning",
  },
  mastered: {
    label: "Mastered",
    icon: Check,
    className: "border-mastered/30 bg-mastered/10 text-mastered",
    dotClass: "bg-mastered",
    textClass: "text-mastered",
  },
};

interface StatusBadgeProps {
  status: WordStatus;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight",
        meta.className,
        className
      )}
    >
      {showIcon && <Icon className="size-3" strokeWidth={2} />}
      {meta.label}
    </span>
  );
}

interface LearnedBadgeProps {
  learned: boolean;
  className?: string;
}

export function LearnedBadge({ learned, className }: LearnedBadgeProps) {
  if (!learned) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-foreground/70",
        className
      )}
    >
      <BookMarked className="size-2.5" strokeWidth={2} />
      Learned
    </span>
  );
}
