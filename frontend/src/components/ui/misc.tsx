"use client";

import * as React from "react";
import { Switch as RS } from "radix-ui";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Badge({ className, tone = "neutral", ...props }: React.ComponentProps<"span"> & { tone?: "neutral" | "ember" | "violet" | "sage" | "rose" | "gold" | "sky" }) {
  const tones = {
    neutral: "bg-surface-2 text-fg-muted",
    ember: "bg-ember-soft text-ember",
    violet: "bg-violet-soft text-violet",
    sage: "bg-sage-soft text-sage",
    rose: "bg-rose-soft text-rose",
    gold: "bg-gold-soft text-gold",
    sky: "bg-sky-soft text-sky",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium leading-5", tones[tone], className)} {...props} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn("size-5 animate-spin text-fg-subtle", className)} />;
}

export function Switch({ checked, onCheckedChange, disabled, id }: { checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean; id?: string }) {
  return (
    <RS.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="relative h-6 w-11 shrink-0 rounded-full bg-surface-2 transition-colors data-[state=checked]:bg-ember disabled:opacity-50"
    >
      <RS.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
    </RS.Root>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className, size = "md" }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode; icon?: React.ReactNode }[]; className?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-full bg-surface p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full font-medium transition-all",
            size === "sm" ? "h-7 px-3 text-[12.5px]" : "h-8.5 px-3.5 text-[13px]",
            value === o.value ? "bg-bg-elevated text-fg shadow-soft" : "text-fg-muted hover:text-fg"
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, body, action, className }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      {icon && <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-surface text-fg-subtle [&_svg]:size-6">{icon}</div>}
      <h3 className="font-display text-xl text-fg">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-fg-muted text-pretty">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between", className)}>
      <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">{children}</h3>
      {action}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}

export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[12px] font-semibold uppercase tracking-[0.14em] text-ember", className)}>{children}</p>;
}
