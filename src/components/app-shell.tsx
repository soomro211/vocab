"use client";

import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { Footer } from "@/components/footer";
import { CategorySwitcher } from "@/components/category-switcher";
import type { TabKey } from "@/lib/types";
import type { ReactNode } from "react";

interface AppShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  children: ReactNode;
}

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background bg-grain">
      {/* Ambient subtle gradient at top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,oklch(1_0_0/0.04),transparent_70%)]"
      />
      <Navbar activeTab={activeTab} onTabChange={onTabChange} />

      {/* Mobile category switcher row */}
      <div className="mx-auto mt-2 w-full max-w-6xl px-4 md:mt-3 md:hidden">
        <CategorySwitcher size="md" fullWidth />
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-16 md:pt-6">
        {children}
      </main>

      <Footer />
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
