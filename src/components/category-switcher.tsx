"use client";

import { motion } from "framer-motion";
import { CATEGORY_META } from "@/lib/word-data";
import type { Category } from "@/lib/types";
import { useVocabStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface CategorySwitcherProps {
  className?: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
}

export function CategorySwitcher({
  className,
  size = "sm",
  fullWidth = false,
}: CategorySwitcherProps) {
  const activeCategory = useVocabStore((s) => s.activeCategory);
  const setActiveCategory = useVocabStore((s) => s.setActiveCategory);

  const categories: Category[] = ["vocabulary", "transitions"];

  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-full border border-border/80 bg-card/60 p-1 backdrop-blur",
        fullWidth && "flex w-full",
        className
      )}
    >
      {categories.map((cat) => {
        const isActive = cat === activeCategory;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "relative z-10 rounded-full font-medium transition-colors duration-200",
              size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-5 py-2 text-sm",
              fullWidth && "flex-1 py-2 text-sm",
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="category-pill"
                className="absolute inset-0 -z-10 rounded-full bg-primary shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {CATEGORY_META[cat].label}
          </button>
        );
      })}
    </div>
  );
}
