export type Category = "vocabulary" | "transitions";

export type WordStatus = "new" | "learning" | "mastered";

export type TabKey =
  | "dashboard"
  | "words"
  | "flashcards"
  | "quiz"
  | "import";

export interface Word {
  id: string;
  term: string;
  definition: string;
  example: string;
  partOfSpeech?: string;
  category: Category;
  /** true if imported by the user, false if part of the default set */
  imported?: boolean;
}

export interface WordProgress {
  wordId: string;
  status: WordStatus;
  /** Manual "learned" toggle, independent of mastery status */
  learned: boolean;
  correctCount: number;
  incorrectCount: number;
  currentStreak: number;
  bestStreak: number;
  lastAnsweredAt: number | null;
}

export interface ImportedCategory {
  category: Category;
  words: Word[];
  createdAt: number;
}

export interface QuizQuestion {
  word: Word;
  options: string[]; // definition choices
  correctIndex: number;
}
