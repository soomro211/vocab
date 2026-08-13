import type { TabKey } from "@/lib/types";
import {
  LayoutDashboard,
  Library,
  Layers,
  CircleHelp,
  Upload,
} from "lucide-react";

export interface NavItem {
  key: TabKey;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
    description: "Progress, accuracy & mastery",
  },
  {
    key: "words",
    label: "Word List",
    shortLabel: "Words",
    icon: Library,
    description: "Browse and manage words",
  },
  {
    key: "flashcards",
    label: "Flashcards",
    shortLabel: "Cards",
    icon: Layers,
    description: "Study with flip cards",
  },
  {
    key: "quiz",
    label: "Quiz",
    shortLabel: "Quiz",
    icon: CircleHelp,
    description: "Multiple choice practice",
  },
  {
    key: "import",
    label: "Import",
    shortLabel: "Import",
    icon: Upload,
    description: "Add your own word lists",
  },
];
