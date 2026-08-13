"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Category, ImportedCategory, Word, WordProgress } from "./types";
import {
  DEFAULT_TRANSITION_WORDS,
  DEFAULT_VOCAB_WORDS,
} from "./word-data";

/** Number of consecutive correct answers required for mastery. */
export const MASTERY_THRESHOLD = 3;

export type QuizDirection = "term-to-def" | "def-to-term";

/** A single answered-question event, used for the activity trend chart. */
export interface ActivityEvent {
  /** Unix ms timestamp (day-resolution is derived on read). */
  ts: number;
  wordId: string;
  category: Category;
  correct: boolean;
}

/** A completed quiz session, used for achievements. */
export interface QuizSession {
  ts: number;
  total: number;
  correct: number;
  perfect: boolean;
  timed: boolean;
}

/** User preferences (persisted). */
export interface Settings {
  /** Last-used quiz length (5/10/20/-1 for all). */
  quizLength: number;
  /** Whether timed mode was last enabled. */
  quizTimed: boolean;
  /** Auto-pronounce words when a flashcard is revealed. */
  autoPronounce: boolean;
  /** Daily question goal for the goal tracker. */
  dailyGoal: number;
  /** Available streak freezes (forgive one missed day each). */
  streakFreezes: number;
  /** When true, the pre-made word lists are hidden everywhere. */
  hideDefaults: boolean;
}

interface VocabState {
  /** Custom word lists imported by the user, keyed by category. */
  imports: ImportedCategory[];
  /** Per-word progress map. */
  progress: Record<string, WordProgress>;
  /** The currently selected category. */
  activeCategory: Category;
  /** Preferred quiz direction. */
  quizDirection: QuizDirection;
  /** Append-only log of answered questions for the activity trend. */
  activity: ActivityEvent[];
  /** Completed quiz sessions for achievements. */
  quizSessions: QuizSession[];
  /** User preferences. */
  settings: Settings;

  // ---- selectors / derived getters ----
  getWordsForCategory: (category: Category) => Word[];
  getProgress: (wordId: string) => WordProgress;

  // ---- mutations ----
  setActiveCategory: (category: Category) => void;
  setQuizDirection: (dir: QuizDirection) => void;
  setSettings: (patch: Partial<Settings>) => void;
  answer: (wordId: string, correct: boolean) => void;
  recordQuizSession: (session: Omit<QuizSession, "ts">) => void;
  toggleLearned: (wordId: string) => void;
  resetWord: (wordId: string) => void;
  resetCategory: (category: Category) => void;
  resetAll: () => void;
  importWords: (
    category: Category,
    words: Omit<Word, "id" | "category" | "imported">[]
  ) => void;
  removeImport: (category: Category, index: number) => void;

  // ---- backup / restore ----
  exportProgress: () => string;
  importProgress: (json: string) => { ok: boolean; error?: string };
}

function defaultProgress(wordId: string): WordProgress {
  return {
    wordId,
    status: "new",
    learned: false,
    correctCount: 0,
    incorrectCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastAnsweredAt: null,
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const useVocabStore = create<VocabState>()(
  persist(
    (set, get) => ({
      imports: [],
      progress: {},
      activeCategory: "vocabulary",
      quizDirection: "term-to-def",
      activity: [],
      quizSessions: [],
      settings: {
        quizLength: 10,
        quizTimed: false,
        autoPronounce: false,
        dailyGoal: 10,
        streakFreezes: 1,
        hideDefaults: false,
      },

      getWordsForCategory: (category) => {
        const defaults =
          get().settings.hideDefaults
            ? []
            : category === "vocabulary"
            ? DEFAULT_VOCAB_WORDS
            : DEFAULT_TRANSITION_WORDS;
        const userImports = get()
          .imports.filter((i) => i.category === category)
          .flatMap((i) => i.words);
        return [...defaults, ...userImports];
      },

      getProgress: (wordId) => {
        return get().progress[wordId] ?? defaultProgress(wordId);
      },

      setActiveCategory: (category) =>
        set({ activeCategory: category }),

      setQuizDirection: (dir) => set({ quizDirection: dir }),

      setSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      recordQuizSession: (session) =>
        set((state) => ({
          quizSessions: [
            ...state.quizSessions,
            { ...session, ts: Date.now() },
          ],
        })),

      answer: (wordId, correct) =>
        set((state) => {
          const prev = state.progress[wordId] ?? defaultProgress(wordId);
          let currentStreak: number;
          let status: WordProgress["status"];

          if (correct) {
            currentStreak = prev.currentStreak + 1;
            status = currentStreak >= MASTERY_THRESHOLD ? "mastered" : "learning";
          } else {
            // A single incorrect answer moves the word back to "learning".
            currentStreak = 0;
            status = "learning";
          }

          const next: WordProgress = {
            ...prev,
            wordId,
            correctCount: prev.correctCount + (correct ? 1 : 0),
            incorrectCount: prev.incorrectCount + (correct ? 0 : 1),
            currentStreak,
            bestStreak: Math.max(prev.bestStreak, currentStreak),
            status,
            lastAnsweredAt: Date.now(),
          };

          // Look up the word's category for the activity log.
          const word = get()
            .getWordsForCategory("vocabulary")
            .concat(get().getWordsForCategory("transitions"))
            .find((w) => w.id === wordId);
          const category: Category = word?.category ?? "vocabulary";

          const event: ActivityEvent = {
            ts: Date.now(),
            wordId,
            category,
            correct,
          };

          return {
            progress: { ...state.progress, [wordId]: next },
            activity: [...state.activity, event],
          };
        }),

      toggleLearned: (wordId) =>
        set((state) => {
          const prev = state.progress[wordId] ?? defaultProgress(wordId);
          return {
            progress: {
              ...state.progress,
              [wordId]: { ...prev, learned: !prev.learned },
            },
          };
        }),

      resetWord: (wordId) =>
        set((state) => {
          const next = { ...state.progress };
          delete next[wordId];
          return { progress: next };
        }),

      resetCategory: (category) =>
        set((state) => {
          const words = get().getWordsForCategory(category);
          const ids = new Set(words.map((w) => w.id));
          const next = { ...state.progress };
          for (const id of Object.keys(next)) {
            if (ids.has(id)) delete next[id];
          }
          return { progress: next };
        }),

      resetAll: () => set({ progress: {}, activity: [], quizSessions: [] }),

      importWords: (category, words) =>
        set((state) => {
          const existing = state.imports.findIndex(
            (i) => i.category === category
          );
          const stamped: Word[] = words.map((w, i) => ({
            ...w,
            id: `${category}-imported-${Date.now()}-${i}-${slugify(w.term)}`,
            category,
            imported: true,
          }));

          if (existing >= 0) {
            const next = [...state.imports];
            next[existing] = {
              ...next[existing],
              words: [...next[existing].words, ...stamped],
              createdAt: Date.now(),
            };
            return { imports: next };
          }
          return {
            imports: [
              ...state.imports,
              { category, words: stamped, createdAt: Date.now() },
            ],
          };
        }),

      removeImport: (category, index) =>
        set((state) => {
          const catImports = state.imports.filter(
            (i) => i.category === category
          );
          if (index >= catImports.length) return state;
          const target = catImports[index];
          const next = state.imports.filter((i) => i !== target);
          // Clean progress for removed words
          const progress = { ...state.progress };
          for (const w of target.words) delete progress[w.id];
          return { imports: next, progress };
        }),

      exportProgress: () => {
        const s = get();
        const payload = {
          app: "lexicon-sat-vocab",
          version: 1,
          exportedAt: new Date().toISOString(),
          progress: s.progress,
          activity: s.activity,
          quizSessions: s.quizSessions,
          imports: s.imports,
          quizDirection: s.quizDirection,
          activeCategory: s.activeCategory,
          settings: s.settings,
        };
        return JSON.stringify(payload, null, 2);
      },

      importProgress: (json) => {
        try {
          const data = JSON.parse(json);
          if (typeof data !== "object" || data === null) {
            return { ok: false, error: "Invalid JSON object." };
          }
          const progress =
            typeof data.progress === "object" && data.progress
              ? (data.progress as Record<string, WordProgress>)
              : {};
          const activity = Array.isArray(data.activity)
            ? (data.activity as ActivityEvent[])
            : [];
          const quizSessions = Array.isArray(data.quizSessions)
            ? (data.quizSessions as QuizSession[])
            : [];
          const imports = Array.isArray(data.imports)
            ? (data.imports as ImportedCategory[])
            : [];
          const settings =
            typeof data.settings === "object" && data.settings
              ? { ...get().settings, ...(data.settings as Partial<Settings>) }
              : get().settings;
          set({
            progress,
            activity,
            quizSessions,
            imports,
            settings,
            quizDirection:
              data.quizDirection === "def-to-term"
                ? "def-to-term"
                : "term-to-def",
            activeCategory:
              data.activeCategory === "transitions"
                ? "transitions"
                : "vocabulary",
          });
          return { ok: true };
        } catch (e) {
          return {
            ok: false,
            error:
              e instanceof Error ? e.message : "Could not parse the JSON file.",
          };
        }
      },
    }),
    {
      name: "lexicon-sat-vocab",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        imports: s.imports,
        progress: s.progress,
        activeCategory: s.activeCategory,
        quizDirection: s.quizDirection,
        activity: s.activity,
        quizSessions: s.quizSessions,
        settings: s.settings,
      }),
    }
  )
);
