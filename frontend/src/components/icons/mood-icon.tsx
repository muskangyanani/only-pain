import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

const soft = { fill: "currentColor", fillOpacity: 0.22 } as const;

// 1 awful → 5 good, drawn as weather. Colour comes from MOOD_SCALE via `style={{ color }}`.
const GLYPHS: Record<number, ReactNode> = {
  1: (
    <>
      <path d="M7.5 15a4.2 4.2 0 0 1-.5-8.4A6 6 0 0 1 18.6 8a3.5 3.5 0 0 1-.4 7z" {...soft} />
      <path d="M8.5 17.5l-.8 2.2M12.5 17.5l-.8 2.2M16.5 17.5l-.8 2.2" />
    </>
  ),
  2: <path d="M7 17a4.5 4.5 0 0 1-.5-8.97A6.5 6.5 0 0 1 19 10.5a3.6 3.6 0 0 1-.5 6.5z" {...soft} />,
  3: <path d="M4 8.5h13M7 12.5h13M4 16.5h11" />,
  4: (
    <>
      <circle cx="9" cy="9" r="3.2" fill="currentColor" fillOpacity={0.35} />
      <path d="M9 3v1.6M4.8 4.8l1.1 1.1M3 9h1.6M4.8 13.2l1.1-1.1M13.2 4.8l-1.1 1.1" />
      <path d="M11.5 19a3.6 3.6 0 0 1-.4-7.18A5 5 0 0 1 20.7 13a3.1 3.1 0 0 1-.4 6z" {...soft} />
    </>
  ),
  5: (
    <>
      <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity={0.35} />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
};

/** Raw glyph for embedding inside another SVG (e.g. chart axes). Inherits stroke/fill from the parent group. */
export function MoodGlyph({ score }: { score: number }) {
  return <>{GLYPHS[Math.min(5, Math.max(1, Math.round(score)))]}</>;
}

export function MoodIcon({ score, className, ...props }: SVGProps<SVGSVGElement> & { score: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("shrink-0", className)} {...props}>
      <MoodGlyph score={score} />
    </svg>
  );
}
