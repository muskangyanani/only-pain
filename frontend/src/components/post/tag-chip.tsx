"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { TAG_LABELS, type Tag } from "@/lib/constants";

export function TagChip({ tag, active, onClick, size = "md", className }: { tag: string; active?: boolean; onClick?: () => void; size?: "sm" | "md"; className?: string }) {
  const label = TAG_LABELS[tag as Tag] ?? tag;
  const cls = cn(
    "inline-flex items-center rounded-full border font-medium transition-colors",
    size === "sm" ? "h-6 px-2 text-[11.5px]" : "h-7.5 px-3 text-[12.5px]",
    active ? "border-ember bg-ember-soft text-ember" : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
    className
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} aria-pressed={active}>
        #{label}
      </button>
    );
  }
  return (
    <Link href={`/explore/tag/${tag}`} className={cls} onClick={(e) => e.stopPropagation()}>
      #{label}
    </Link>
  );
}

export function CircleChip({ circle, size = "md", className }: { circle: { slug: string; name: string; emoji: string; hue: number }; size?: "sm" | "md"; className?: string }) {
  return (
    <Link
      href={`/circles/${circle.slug}`}
      onClick={(e) => e.stopPropagation()}
      className={cn("inline-flex max-w-full items-center gap-1 rounded-full border font-medium transition-colors hover:brightness-110", size === "sm" ? "h-6 px-2 text-[11.5px]" : "h-7.5 px-3 text-[12.5px]", className)}
      style={{ background: `oklch(0.7 0.12 ${circle.hue} / 0.14)`, borderColor: `oklch(0.7 0.12 ${circle.hue} / 0.3)`, color: `oklch(var(--tw-chip-l, 0.62) 0.13 ${circle.hue})` }}
    >
      <span aria-hidden>{circle.emoji}</span>
      <span className="truncate">{circle.name}</span>
    </Link>
  );
}
