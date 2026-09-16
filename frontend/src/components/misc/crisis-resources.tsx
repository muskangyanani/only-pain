"use client";

import Link from "next/link";
import { LifeBuoy, Phone, ExternalLink, Sparkles } from "lucide-react";
import { HELPLINES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CrisisResources({ compact, className, title = "You don't have to hold this alone", intro }: { compact?: boolean; className?: string; title?: string; intro?: string }) {
  const lines = compact ? HELPLINES.slice(0, 3) : HELPLINES;
  return (
    <div className={cn("rounded-2xl border border-ember/30 bg-ember-soft/60 p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-ember text-ember-fg">
          <LifeBuoy className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[17px] text-fg">{title}</p>
          <p className="mt-0.5 text-[13.5px] text-fg-muted text-pretty">{intro ?? "These lines are free, confidential and open right now. Calling is allowed even if you're not sure it's 'bad enough'."}</p>
          <ul className="mt-3 space-y-1.5">
            {lines.map((h) => (
              <li key={h.name} className="flex items-center justify-between gap-3 text-[13.5px]">
                <span className="min-w-0 truncate text-fg-muted">
                  <span className="mr-1.5 rounded bg-bg-elevated/70 px-1 py-0.5 text-[10.5px] font-semibold text-fg-subtle">{h.country}</span>
                  {h.name}
                </span>
                {h.tel ? (
                  <a href={`tel:${h.tel}`} className="inline-flex shrink-0 items-center gap-1 font-semibold text-ember hover:underline">
                    <Phone className="size-3.5" /> {h.contact}
                  </a>
                ) : (
                  <a href={h.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 font-semibold text-ember hover:underline">
                    {h.contact} <ExternalLink className="size-3.5" />
                  </a>
                )}
              </li>
            ))}
          </ul>
          {!compact && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="soft">
                <Link href="/ember"><Sparkles /> Talk to Ember</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/resources">All resources</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Shown once after a post/comment that matched crisis language. Gentle, not punitive. */
export function SafetyNotice({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Your post is up. And we noticed it sounds heavy.</DialogTitle>
          <DialogDescription>Nothing is in trouble and nothing was blocked. We just want to put these where you can see them, in case tonight is one of those nights.</DialogDescription>
        </DialogHeader>
        <CrisisResources />
      </DialogContent>
    </Dialog>
  );
}
