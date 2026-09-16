"use client";

import * as React from "react";
import { Dialog as RD } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = RD.Root;
export const DialogTrigger = RD.Trigger;
export const DialogClose = RD.Close;

export function DialogContent({
  className,
  children,
  hideClose,
  size = "md",
  ...props
}: React.ComponentProps<typeof RD.Content> & { hideClose?: boolean; size?: "sm" | "md" | "lg" | "xl" }) {
  const widths = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };
  return (
    <RD.Portal>
      <RD.Overlay className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />
      <RD.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-[90] max-h-[92dvh] overflow-y-auto rounded-t-3xl border border-border bg-bg-elevated p-5 shadow-pop outline-none data-[state=open]:animate-fade-up",
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6",
          widths[size],
          className
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <RD.Close className="absolute right-4 top-4 rounded-full p-2 text-fg-subtle transition-colors hover:bg-surface hover:text-fg" aria-label="Close">
            <X className="size-4" />
          </RD.Close>
        )}
      </RD.Content>
    </RD.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-4 pr-8", className)} {...props} />;
}
export function DialogTitle({ className, ...props }: React.ComponentProps<typeof RD.Title>) {
  return <RD.Title className={cn("font-display text-[22px] font-medium leading-tight text-fg", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.ComponentProps<typeof RD.Description>) {
  return <RD.Description className={cn("mt-1 text-sm text-fg-muted", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
