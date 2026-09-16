import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

export function EmberMark({ className, size = 22 }: { className?: string; size?: number }) {
  // Unique gradient id per instance: a shared id resolves to the first SVG in the
  // DOM, which may be inside a hidden element and then renders nothing.
  const id = `ember-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={cn("shrink-0", className)} aria-hidden>
      <defs>
        <radialGradient id={id} cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="55%" stopColor="var(--ember)" />
          <stop offset="100%" stopColor="var(--violet)" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <path
        d="M16 3c1.2 4.4 4.8 6.5 6.9 9.6 2.2 3.2 2.6 7.3.5 10.7A9 9 0 0 1 7.8 22c-1.6-3.3-.8-7.1 1.4-9.7-.2 2 .6 3.5 1.9 4.4.3-4.6 1.6-9.6 4.9-13.7Z"
        fill={`url(#${id})`}
      />
      <path d="M16 15.5c.9 2 2.6 3 3.4 4.6 1 2.2-.2 5-2.9 5.4-2.6.4-4.7-1.7-4.4-4.1.2-1.8 1.4-2.4 2-3.6.4.9.9 1.4 1.4 1.7.1-1.5.2-2.9.5-4Z" fill="var(--bg)" opacity="0.85" />
    </svg>
  );
}

export function Wordmark({ className, size = "md", href = "/", withMark = true }: { className?: string; size?: "sm" | "md" | "lg" | "xl"; href?: string | null; withMark?: boolean }) {
  const sizes = { sm: "text-[19px]", md: "text-[23px]", lg: "text-[30px]", xl: "text-[44px]" };
  const marks = { sm: 18, md: 22, lg: 28, xl: 40 };
  const inner = (
    <span className={cn("inline-flex items-center gap-1.5 font-display leading-none tracking-tight", sizes[size], className)}>
      {withMark && <EmberMark size={marks[size]} />}
      <span className="text-fg">only</span>
      <span className="italic text-ember">pain</span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="inline-flex rounded-lg" aria-label="only pain — home">
      {inner}
    </Link>
  );
}
