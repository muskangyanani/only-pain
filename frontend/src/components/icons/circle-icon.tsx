import type { CSSProperties, ReactNode, SVGProps } from "react";
import { CIRCLE_ICONS, type CircleIconKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

const soft = { fill: "currentColor", fillOpacity: 0.22 } as const;

const FLAME = (
  <>
    <path d="M12 3.4c.9 3.3 3.6 4.9 5.2 7.2 1.6 2.4 1.9 5.5.4 8a6.8 6.8 0 0 1-11.5-.6c-1.2-2.5-.6-5.3 1-7.3-.1 1.5.5 2.6 1.4 3.3.2-3.5 1.2-7.3 3.5-10.6z" {...soft} />
    <path d="M12 12.6c.6 1.4 1.8 2.1 2.4 3.3.7 1.5-.2 3.4-2 3.7-1.8.3-3.3-1.2-3.1-2.9.1-1.2.9-1.7 1.4-2.5.3.6.6.9 1 1.2.1-1 .1-1.9.3-2.8z" fill="currentColor" fillOpacity={0.5} />
  </>
);
const TOGETHER = (
  <>
    <circle cx="8.6" cy="8" r="2.7" {...soft} />
    <path d="M3.2 20c0-3.3 2.4-5.5 5.4-5.5s5.4 2.2 5.4 5.5" {...soft} />
    <circle cx="16.8" cy="8.8" r="2.4" {...soft} />
    <path d="M12.8 20c.4-2.4 2.1-4.1 4.3-4.1 2.5 0 4.5 2 4.5 4.5" {...soft} />
  </>
);
const TEDDY = (
  <>
    <circle cx="7.2" cy="8.4" r="2.4" {...soft} />
    <circle cx="16.8" cy="8.4" r="2.4" {...soft} />
    <circle cx="12" cy="13" r="6.4" {...soft} />
    <ellipse cx="12" cy="15.3" rx="2.7" ry="2" />
    <circle cx="12" cy="14.5" r=".9" fill="currentColor" stroke="none" />
    <circle cx="9.7" cy="11.8" r=".8" fill="currentColor" stroke="none" />
    <circle cx="14.3" cy="11.8" r=".8" fill="currentColor" stroke="none" />
  </>
);

const GLYPHS: Record<CircleIconKey, ReactNode> = {
  together: TOGETHER,
  moon: (
    <>
      <path d="M14.5 3.2a8.6 8.6 0 1 0 6.3 14.2A7.2 7.2 0 0 1 14.5 3.2z" {...soft} />
      <circle cx="17.6" cy="6.2" r=".8" fill="currentColor" stroke="none" />
      <circle cx="20.4" cy="9.8" r=".6" fill="currentColor" stroke="none" />
    </>
  ),
  flame: FLAME,
  candle: (
    <>
      <rect x="8.5" y="11" width="7" height="9.5" rx="1.5" {...soft} />
      <path d="M12 10.5V9" />
      <path d="M12 2.8c1.3 1.7 2.1 3 2.1 4.2a2.1 2.1 0 1 1-4.2 0c0-1.2.8-2.5 2.1-4.2z" fill="currentColor" fillOpacity={0.45} />
      <path d="M8.5 20.5h7" />
    </>
  ),
  wave: (
    <>
      <path d="M2.5 16.5c2.4 0 2.4-2 4.8-2s2.4 2 4.8 2 2.4-2 4.8-2 2.4 2 4.6 2V21h-19z" fill="currentColor" fillOpacity={0.22} stroke="none" />
      <path d="M2.5 11c2.4 0 2.4-2 4.8-2s2.4 2 4.8 2 2.4-2 4.8-2 2.4 2 4.6 2" />
      <path d="M2.5 16.5c2.4 0 2.4-2 4.8-2s2.4 2 4.8 2 2.4-2 4.8-2 2.4 2 4.6 2" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 20.5v-8" />
      <path d="M12 12.5c0-3.6 2.6-6.3 6.3-6.3 0 3.6-2.6 6.3-6.3 6.3z" {...soft} />
      <path d="M12 15.5c0-2.9-2.1-5-5-5 0 2.9 2.1 5 5 5z" {...soft} />
      <path d="M7 20.5h10" />
    </>
  ),
  brain: (
    <>
      <path d="M11.5 4.5c-1.7-1.2-4.3-.4-4.7 1.8-1.9.2-3 2-2.4 3.7-1.5 1.2-1.3 3.5.4 4.4-.2 1.9 1.3 3.4 3.2 3.2.8 1.5 2.7 2 3.5 1z" {...soft} />
      <path d="M12.5 4.5c1.7-1.2 4.3-.4 4.7 1.8 1.9.2 3 2 2.4 3.7 1.5 1.2 1.3 3.5-.4 4.4.2 1.9-1.3 3.4-3.2 3.2-.8 1.5-2.7 2-3.5 1z" {...soft} />
      <path d="M8.2 9.3c1.3.2 2.2 1.1 2.5 2.4M15.8 9.3c-1.3.2-2.2 1.1-2.5 2.4" />
    </>
  ),
  sparkle: (
    <>
      <path d="M11 3.5l1.9 5.4 5.4 1.9-5.4 1.9-1.9 5.4-1.9-5.4-5.4-1.9 5.4-1.9z" {...soft} />
      <path d="M18.3 14.8l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" {...soft} />
    </>
  ),
  coffee: (
    <>
      <path d="M5 9.5h11v5.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 15z" {...soft} />
      <path d="M16 11h1.3a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8.5 3.5c-.9 1 .9 2.2 0 3.2M12 3.5c-.9 1 .9 2.2 0 3.2" />
    </>
  ),
  rain: (
    <>
      <path d="M7.5 16a4.2 4.2 0 0 1-.5-8.4A6 6 0 0 1 18.6 9a3.5 3.5 0 0 1-.4 7z" {...soft} />
      <path d="M9 18.5l-.8 2M13 18.5l-.8 2M17 18.5l-.8 2" />
    </>
  ),
  leaf: (
    <>
      <path d="M5.5 18.5c0-7.5 5.5-12.5 13-12.5-.7 8-5.5 12.5-13 12.5z" {...soft} />
      <path d="M5.5 18.5c3-3.5 6-6.5 9.5-9" />
    </>
  ),
  teddy: TEDDY,
  headphones: (
    <>
      <path d="M4.5 15v-3.2a7.5 7.5 0 0 1 15 0V15" />
      <rect x="3.5" y="13.5" width="4" height="6" rx="1.5" {...soft} />
      <rect x="16.5" y="13.5" width="4" height="6" rx="1.5" {...soft} />
    </>
  ),
  notebook: (
    <>
      <path d="M6.5 4h9.5a2 2 0 0 1 2 2v14H6.5z" {...soft} />
      <path d="M4.5 8h2M4.5 12h2M4.5 16h2M10 9h5M10 12.5h5" />
    </>
  ),
  feather: (
    <>
      <path d="M20 4c-6.5 0-11 4.5-12.5 10.5 6-1.5 10.5-6 12.5-10.5z" {...soft} />
      <path d="M19 5L8.5 15.5M7.5 14.5L4 20" />
    </>
  ),
  bubbles: (
    <>
      <circle cx="9" cy="14.5" r="5" {...soft} />
      <circle cx="17" cy="8" r="3" {...soft} />
      <circle cx="16.5" cy="16.5" r="2" {...soft} />
      <path d="M6.5 13.2a2.6 2.6 0 0 1 1.8-2.2" />
    </>
  ),
  umbrella: (
    <>
      <path d="M12 3.5a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z" {...soft} />
      <path d="M12 12.5v6.5a2 2 0 0 1-4 0M12 3.5v-1" />
    </>
  ),
};

export const CIRCLE_ICON_LABELS: Record<CircleIconKey, string> = {
  together: "together", moon: "night", flame: "burnout", candle: "remembrance", wave: "anxiety", sprout: "recovery", brain: "adhd", sparkle: "small wins",
  coffee: "mornings", rain: "low days", leaf: "growth", teddy: "comfort", headphones: "quiet", notebook: "journaling", feather: "gentle", bubbles: "letting go", umbrella: "shelter",
};

export function isCircleIcon(key: string): key is CircleIconKey {
  return (CIRCLE_ICONS as readonly string[]).includes(key);
}

export function CircleIcon({ icon, className, ...props }: SVGProps<SVGSVGElement> & { icon: string }) {
  const key: CircleIconKey = isCircleIcon(icon) ? icon : "together";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("shrink-0", className)} {...props}>
      {GLYPHS[key]}
    </svg>
  );
}

const BADGE_SIZES = { xs: "size-6 rounded-lg [&_svg]:size-3.5", sm: "size-9 rounded-xl [&_svg]:size-5", md: "size-12 rounded-2xl [&_svg]:size-6", lg: "size-16 rounded-3xl [&_svg]:size-8" };

/** The tinted square that identifies a circle everywhere: hue-tinted background, hue-coloured glyph. */
export function CircleBadge({ icon, hue, size = "md", className }: { icon: string; hue: number; size?: keyof typeof BADGE_SIZES; className?: string }) {
  const style = { "--h": String(hue), background: `oklch(0.7 0.12 ${hue} / 0.18)` } as CSSProperties;
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center text-[oklch(0.55_0.15_var(--h))] dark:text-[oklch(0.8_0.12_var(--h))]", BADGE_SIZES[size], className)} style={style}>
      <CircleIcon icon={icon} />
    </span>
  );
}
