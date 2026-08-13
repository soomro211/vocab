"use client";

import { useMemo } from "react";
import { useVocabStore } from "./store";
import {
  computeStats,
  overallFromCategory,
  type CategoryStats,
  type OverallStats,
} from "./stats";
import { CATEGORY_META } from "./word-data";
import type { Category } from "./types";

export interface VocabStats {
  overall: OverallStats;
  byCategory: Record<Category, CategoryStats>;
  active: CategoryStats;
}

export function useVocabStats(): VocabStats {
  const progress = useVocabStore((s) => s.progress);
  const activeCategory = useVocabStore((s) => s.activeCategory);
  const getWordsForCategory = useVocabStore((s) => s.getWordsForCategory);

  return useMemo(() => {
    const byCategory = {} as Record<Category, CategoryStats>;
    (Object.keys(CATEGORY_META) as Category[]).forEach((cat) => {
      byCategory[cat] = computeStats(getWordsForCategory(cat), progress);
    });
    const overall = overallFromCategory(byCategory);
    return {
      overall,
      byCategory,
      active: byCategory[activeCategory],
    };
  }, [progress, activeCategory, getWordsForCategory]);
}
