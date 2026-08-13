"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { speak } from "@/lib/tts-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SpeakButtonProps {
  term: string;
  className?: string;
  label?: boolean;
  size?: "sm" | "icon";
}

export function SpeakButton({
  term,
  className,
  label = false,
  size = "sm",
}: SpeakButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSpeak = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await speak(term);
    } catch {
      toast.error("Couldn't play pronunciation");
    } finally {
      setLoading(false);
    }
  };

  if (size === "icon") {
    return (
      <button
        type="button"
        onClick={handleSpeak}
        disabled={loading}
        aria-label={`Pronounce ${term}`}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50",
          className
        )}
      >
        <Volume2
          className={cn("size-3.5", loading && "animate-pulse")}
          strokeWidth={1.75}
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-7 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground",
        className
      )}
      onClick={handleSpeak}
      disabled={loading}
      aria-label={`Pronounce ${term}`}
    >
      <Volume2
        className={cn("size-3.5", loading && "animate-pulse")}
        strokeWidth={1.75}
      />
      {label && <span className="hidden sm:inline">Pronounce</span>}
    </Button>
  );
}
