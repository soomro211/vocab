"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { DashboardView } from "@/components/views/dashboard-view";
import { WordListView } from "@/components/views/word-list-view";
import { FlashcardView } from "@/components/views/flashcard-view";
import { QuizView } from "@/components/views/quiz-view";
import { ImportView } from "@/components/views/import-view";
import type { TabKey } from "@/lib/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === "dashboard" && (
            <DashboardView onNavigate={setActiveTab} />
          )}
          {activeTab === "words" && (
            <WordListView onNavigate={setActiveTab} />
          )}
          {activeTab === "flashcards" && <FlashcardView />}
          {activeTab === "quiz" && <QuizView onNavigate={setActiveTab} />}
          {activeTab === "import" && <ImportView />}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
