import type { ReactNode, SVGProps } from "react";
import type { ReactionType } from "@/lib/constants";
import { cn } from "@/lib/utils";

// "Ink" glyphs: a single stroke in the reaction's tone with a soft tinted fill.
// Drawn on a 24×24 grid so they read at 16px inside a pill and at 32px on the landing page.
const soft = { fill: "currentColor", fillOpacity: 0.22 } as const;

const GLYPHS: Record<ReactionType, ReactNode> = {
  HEART: (
    <path d="M12 20.2c-.6-.5-7.2-4.9-7.3-10 0-2.4 1.8-4.1 4-4.1 1.5 0 2.7.8 3.3 2 .7-1.2 1.9-2.1 3.4-2.1 2.3 0 4 1.8 3.9 4.2-.2 5.1-6.7 9.5-7.3 10z" {...soft} />
  ),
  FEEL_THIS: (
    <>
      <path d="M12 18.4c-.6-.5-6.8-4.4-6.9-9 0-2.3 1.7-3.9 3.8-3.9 1.4 0 2.5.8 3.1 1.9.6-1.1 1.8-2 3.2-2 2.2 0 3.8 1.7 3.7 4-.1 3.9-4.9 7.9-6.9 9z" {...soft} />
      <path d="M9 17c.4 1.6.2 2.9-.7 4M14.2 17.6c.2 1.1 0 2-.6 2.8" />
    </>
  ),
  NOT_ALONE: (
    <>
      <circle cx="8.6" cy="8" r="2.7" {...soft} />
      <path d="M3.2 20c0-3.3 2.4-5.5 5.4-5.5s5.4 2.2 5.4 5.5" {...soft} />
      <circle cx="16.8" cy="8.8" r="2.4" {...soft} />
      <path d="M12.8 20c.4-2.4 2.1-4.1 4.3-4.1 2.5 0 4.5 2 4.5 4.5" {...soft} />
    </>
  ),
  STRENGTH: (
    <>
      <path d="M12 3.4c.9 3.3 3.6 4.9 5.2 7.2 1.6 2.4 1.9 5.5.4 8a6.8 6.8 0 0 1-11.5-.6c-1.2-2.5-.6-5.3 1-7.3-.1 1.5.5 2.6 1.4 3.3.2-3.5 1.2-7.3 3.5-10.6z" {...soft} />
      <path d="M12 12.6c.6 1.4 1.8 2.1 2.4 3.3.7 1.5-.2 3.4-2 3.7-1.8.3-3.3-1.2-3.1-2.9.1-1.2.9-1.7 1.4-2.5.3.6.6.9 1 1.2.1-1 .1-1.9.3-2.8z" fill="currentColor" fillOpacity={0.5} />
    </>
  ),
  HUG: (
    <>
      <circle cx="7.2" cy="8.4" r="2.4" {...soft} />
      <circle cx="16.8" cy="8.4" r="2.4" {...soft} />
      <circle cx="12" cy="13" r="6.4" {...soft} />
      <ellipse cx="12" cy="15.3" rx="2.7" ry="2" />
      <circle cx="12" cy="14.5" r=".9" fill="currentColor" stroke="none" />
      <circle cx="9.7" cy="11.8" r=".8" fill="currentColor" stroke="none" />
      <circle cx="14.3" cy="11.8" r=".8" fill="currentColor" stroke="none" />
    </>
  ),
};

/** Tailwind classes per reaction tone (static strings so the compiler keeps them). */
export const REACTION_TONE: Record<ReactionType, { text: string; pill: string }> = {
  HEART: { text: "text-rose", pill: "border-rose/40 bg-rose-soft text-rose" },
  FEEL_THIS: { text: "text-violet", pill: "border-violet/40 bg-violet-soft text-violet" },
  NOT_ALONE: { text: "text-sky", pill: "border-sky/40 bg-sky-soft text-sky" },
  STRENGTH: { text: "text-ember", pill: "border-ember/40 bg-ember-soft text-ember" },
  HUG: { text: "text-gold", pill: "border-gold/40 bg-gold-soft text-gold" },
};

export function ReactionIcon({ type, className, ...props }: SVGProps<SVGSVGElement> & { type: ReactionType }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("shrink-0", className)} {...props}>
      {GLYPHS[type]}
    </svg>
  );
}
