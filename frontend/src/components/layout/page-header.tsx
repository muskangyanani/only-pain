"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, back, actions, className, sticky = true }: { title: React.ReactNode; subtitle?: React.ReactNode; back?: boolean | string; actions?: React.ReactNode; className?: string; sticky?: boolean }) {
  const router = useRouter();
  return (
    <div className={cn(sticky && "sticky top-14 z-30 -mx-3 mb-3 px-3 py-2 backdrop-blur-md md:top-0 md:-mx-0 md:mb-4 md:px-0 md:py-3 [background:color-mix(in_oklab,var(--bg)_86%,transparent)]", className)}>
      <div className="flex items-center gap-3">
        {back && (
          <button onClick={() => (typeof back === "string" ? router.push(back) : router.back())} className="-ml-1 rounded-full p-2 text-fg-muted transition-colors hover:bg-surface hover:text-fg" aria-label="Back">
            <ArrowLeft className="size-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[24px] leading-tight text-fg md:text-[28px]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[13.5px] text-fg-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
