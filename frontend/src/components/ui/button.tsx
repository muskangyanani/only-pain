"use client";

import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ember text-ember-fg shadow-[0_8px_24px_-10px_var(--ember)] hover:brightness-105 hover:shadow-glow",
        secondary: "bg-surface-2 text-fg hover:bg-border-strong",
        soft: "bg-ember-soft text-ember hover:bg-ember/25",
        outline: "border border-border-strong bg-transparent text-fg hover:bg-surface",
        ghost: "bg-transparent text-fg-muted hover:bg-surface hover:text-fg",
        danger: "bg-rose-soft text-rose hover:bg-rose/25",
        link: "text-ember underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-2.5 text-[12px] [&_svg]:size-3.5",
        sm: "h-8 px-3.5 text-[13px] [&_svg]:size-4",
        md: "h-10 px-4.5 text-sm [&_svg]:size-4",
        lg: "h-12 px-6 text-[15px] [&_svg]:size-5",
        icon: "size-10 [&_svg]:size-[18px]",
        "icon-sm": "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean };

export function Button({ className, variant, size, asChild, loading, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {asChild ? (
        children
      ) : (
        <>
          {loading ? <LoaderCircle className="animate-spin" /> : null}
          {children}
        </>
      )}
    </Comp>
  );
}

export { buttonVariants };
