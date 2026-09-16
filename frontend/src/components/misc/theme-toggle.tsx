"use client";

import { useTheme } from "next-themes";
import { Moon, SunMedium } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className, withLabel }: { className?: string; withLabel?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = (resolvedTheme ?? "dark") === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn("inline-flex items-center gap-3 rounded-full text-fg-muted transition-colors hover:bg-surface hover:text-fg", className)}
      aria-label="Toggle theme"
    >
      {dark ? <SunMedium className="size-5" /> : <Moon className="size-5" />}
      {withLabel && <span>{dark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
