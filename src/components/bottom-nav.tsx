"use client";

import { motion } from "framer-motion";
import { NAV_ITEMS } from "@/components/nav-config";
import type { TabKey } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      aria-label="Primary"
    >
      {/* Hairline + fade above the bar */}
      <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background to-transparent" />
      <div className="border-t border-border/70 bg-card/80 backdrop-blur-xl">
        <div
          className="mx-auto flex max-w-md items-stretch justify-between gap-1 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5"
          style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeTab;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onTabChange(item.key)}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute -top-px h-0.5 w-8 rounded-full bg-foreground"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "transition-transform duration-200",
                    isActive ? "size-5" : "size-[18px]"
                  )}
                  strokeWidth={isActive ? 2 : 1.6}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-tight",
                    isActive && "text-foreground"
                  )}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
