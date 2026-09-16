"use client";

import * as React from "react";
import { Popover as RP, Tooltip as RT } from "radix-ui";
import { cn } from "@/lib/utils";

export const Popover = RP.Root;
export const PopoverTrigger = RP.Trigger;
export const PopoverAnchor = RP.Anchor;

export function PopoverContent({ className, align = "center", sideOffset = 8, ...props }: React.ComponentProps<typeof RP.Content>) {
  return (
    <RP.Portal>
      <RP.Content
        align={align}
        sideOffset={sideOffset}
        className={cn("z-[100] rounded-2xl border border-border-strong bg-bg-elevated p-3 shadow-pop outline-none data-[state=open]:animate-pop", className)}
        {...props}
      />
    </RP.Portal>
  );
}

export function Tip({ label, children, side = "top" }: { label: React.ReactNode; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <RT.Root delayDuration={250}>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          side={side}
          sideOffset={6}
          className="z-[110] rounded-lg bg-fg px-2.5 py-1.5 text-[12px] font-medium text-bg shadow-pop data-[state=delayed-open]:animate-fade-in"
        >
          {label}
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}
