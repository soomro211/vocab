"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookText, RotateCcw, Settings } from "lucide-react";
import { NAV_ITEMS } from "@/components/nav-config";
import { CategorySwitcher } from "@/components/category-switcher";
import { SettingsDialog } from "@/components/settings-dialog";
import { useVocabStore } from "@/lib/store";
import type { TabKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useVocabStats } from "@/lib/use-vocab-stats";

interface NavbarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const resetAll = useVocabStore((s) => s.resetAll);
  const resetCategory = useVocabStore((s) => s.resetCategory);
  const activeCategory = useVocabStore((s) => s.activeCategory);
  const stats = useVocabStats();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-3 md:gap-4 md:px-6 md:pt-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card/70 backdrop-blur">
            <BookText className="size-4.5 text-foreground" strokeWidth={1.5} />
          </div>
          <div className="hidden leading-none sm:block">
            <div className="font-serif-display text-lg font-medium tracking-tight">
              Lexicon
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              SAT Vocabulary
            </div>
          </div>
        </div>

        {/* Center nav */}
        <nav className="mx-auto hidden items-center rounded-full border border-border/70 bg-card/50 p-1 backdrop-blur-md md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeTab;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onTabChange(item.key)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="size-3.5" strokeWidth={1.75} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <CategorySwitcher className="hidden md:inline-flex" />
          {/* Quick reset dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-full border border-border/70 bg-card/50 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
                aria-label="More options"
              >
                <RotateCcw className="size-4" strokeWidth={1.75} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Quick actions
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="size-3.5" strokeWidth={1.75} />
                Open settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Reset progress
              </div>
              <DropdownMenuItem
                onClick={() => {
                  resetCategory(activeCategory);
                  toast.success(
                    `Reset progress for ${
                      activeCategory === "vocabulary"
                        ? "Vocabulary"
                        : "Transitions"
                    }`
                  );
                }}
              >
                Reset "{activeCategory}" only
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  resetAll();
                  toast.success("All progress reset");
                }}
              >
                Reset everything
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Settings gear */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border/70 bg-card/50 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
            aria-label="Open settings"
          >
            <Settings className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Stats ribbon */}
      <div className="mx-auto mt-3 hidden max-w-6xl items-center gap-5 px-6 md:flex">
        <div className="flex items-center gap-2 text-xs">
          <span className="size-1.5 rounded-full bg-mastered" />
          <span className="font-medium text-foreground/80 tabular-nums">
            {stats.overall.mastered}
          </span>
          <span className="text-muted-foreground">mastered</span>
        </div>
        <div className="h-3.5 w-px bg-border/70" />
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-foreground/80 tabular-nums">
            {stats.overall.accuracy > 0
              ? `${Math.round(stats.overall.accuracy * 100)}%`
              : "—"}
          </span>
          <span className="text-muted-foreground">accuracy</span>
        </div>
        <div className="h-3.5 w-px bg-border/70" />
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-foreground/80 tabular-nums">
            {stats.overall.bestStreak}
          </span>
          <span className="text-muted-foreground">best streak</span>
        </div>
      </div>
    </header>
  );
}
