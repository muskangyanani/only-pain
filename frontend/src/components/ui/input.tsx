import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-[15px] text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-ember focus:bg-bg-elevated focus:ring-4 focus:ring-ember-soft disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, autoGrow, ...props }: React.ComponentProps<"textarea"> & { autoGrow?: boolean }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    if (!autoGrow || !ref.current) return;
    const el = ref.current;
    const fit = () => {
      // Collapse first so scrollHeight reflects the content, not the previous height.
      el.style.height = "0px";
      const cs = getComputedStyle(el);
      const border = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
      el.style.height = `${Math.min(el.scrollHeight + border, 480)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [props.value, autoGrow, props.rows]);
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] leading-relaxed text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-ember focus:bg-bg-elevated focus:ring-4 focus:ring-ember-soft disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-[13px] font-medium text-fg-muted", className)} {...props} />;
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string | null; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="mt-1.5 text-[13px] text-rose">{error}</p> : hint ? <p className="mt-1.5 text-[12.5px] text-fg-subtle">{hint}</p> : null}
    </div>
  );
}
