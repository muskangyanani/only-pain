"use client";

import * as React from "react";
import { DropdownMenu as RD } from "radix-ui";
import { cn } from "@/lib/utils";

export const Menu = RD.Root;
export const MenuTrigger = RD.Trigger;

export function MenuContent({ className, align = "end", sideOffset = 6, ...props }: React.ComponentProps<typeof RD.Content>) {
  return (
    <RD.Portal>
      <RD.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[100] min-w-[190px] overflow-hidden rounded-2xl border border-border-strong bg-bg-elevated p-1.5 shadow-pop data-[state=open]:animate-pop",
          className
        )}
        {...props}
      />
    </RD.Portal>
  );
}

export function MenuItem({ className, danger, ...props }: React.ComponentProps<typeof RD.Item> & { danger?: boolean }) {
  return (
    <RD.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-fg outline-none transition-colors data-[highlighted]:bg-surface [&_svg]:size-4 [&_svg]:text-fg-muted",
        danger && "text-rose data-[highlighted]:bg-rose-soft [&_svg]:text-rose",
        className
      )}
      {...props}
    />
  );
}

export function MenuSeparator({ className, ...props }: React.ComponentProps<typeof RD.Separator>) {
  return <RD.Separator className={cn("my-1.5 h-px bg-border", className)} {...props} />;
}

export function MenuLabel({ className, ...props }: React.ComponentProps<typeof RD.Label>) {
  return <RD.Label className={cn("px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle", className)} {...props} />;
}
