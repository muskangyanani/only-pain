"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { HandHeart } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { REACTIONS, REACTION_META, type ReactionType } from "@/lib/constants";
import type { Post } from "@/lib/types";
import { patchPostInCaches } from "@/lib/cache";
import { cn } from "@/lib/utils";
import { useGuestGate } from "@/components/misc/guest-gate";
import { Popover, PopoverContent, PopoverTrigger, Tip } from "@/components/ui/popover";

type Result = { myReaction: ReactionType | null; reactions: Record<ReactionType, number>; reactionCount: number };

export function ReactionBar({ post }: { post: Post }) {
  const qc = useQueryClient();
  const gate = useGuestGate();
  const [open, setOpen] = React.useState(false);

  const m = useMutation({
    mutationFn: (type: ReactionType | null) => api.post<Result>(`/api/posts/${post.id}/react`, { type }),
    onMutate: async (type) => {
      const prev = { myReaction: post.myReaction, reactions: { ...post.reactions }, reactionCount: post.reactionCount };
      const next = { ...prev.reactions };
      if (prev.myReaction) next[prev.myReaction] = Math.max(0, next[prev.myReaction] - 1);
      if (type) next[type] = (next[type] ?? 0) + 1;
      patchPostInCaches(qc, post.id, { myReaction: type, reactions: next, reactionCount: Object.values(next).reduce((a, b) => a + b, 0) });
      return prev;
    },
    onError: (e: Error, _v, prev) => {
      if (prev) patchPostInCaches(qc, post.id, prev);
      toast.error(e.message);
    },
    onSuccess: (data) => patchPostInCaches(qc, post.id, data),
  });

  const react = (type: ReactionType) => {
    setOpen(false);
    gate("react to posts", () => m.mutate(post.myReaction === type ? null : type));
  };

  const top = REACTIONS.filter((r) => (post.reactions?.[r] ?? 0) > 0).sort((a, b) => post.reactions[b] - post.reactions[a]);
  const mine = post.myReaction ? REACTION_META[post.myReaction] : null;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "group inline-flex h-8.5 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-all",
              mine ? "border-ember/40 bg-ember-soft text-ember" : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
            )}
            aria-label="React"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mine ? (
                <motion.span key={post.myReaction} initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 22 }} className="text-[15px] leading-none">
                  {mine.emoji}
                </motion.span>
              ) : (
                <motion.span key="icon" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
                  <HandHeart className="size-4 transition-transform group-hover:-rotate-6" />
                </motion.span>
              )}
            </AnimatePresence>
            <span>{mine ? mine.short : "react"}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex gap-1 p-1.5">
          {REACTIONS.map((r, i) => (
            <Tip key={r} label={REACTION_META[r].label}>
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.035, type: "spring", stiffness: 500, damping: 24 }}
                whileHover={{ scale: 1.25, y: -3 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => react(r)}
                className={cn("flex size-11 items-center justify-center rounded-xl text-[22px] leading-none transition-colors hover:bg-surface", post.myReaction === r && "bg-ember-soft ring-1 ring-ember/40")}
                aria-label={REACTION_META[r].label}
              >
                {REACTION_META[r].emoji}
              </motion.button>
            </Tip>
          ))}
        </PopoverContent>
      </Popover>

      {top.map((r) => (
        <Tip key={r} label={REACTION_META[r].label}>
          <button
            type="button"
            onClick={() => react(r)}
            className={cn(
              "inline-flex h-8.5 items-center gap-1 rounded-full border px-2.5 text-[13px] tabular-nums transition-colors",
              post.myReaction === r ? "border-ember/40 bg-ember-soft text-ember" : "border-border bg-transparent text-fg-muted hover:bg-surface"
            )}
          >
            <span className="text-[14px] leading-none">{REACTION_META[r].emoji}</span>
            <span>{post.reactions[r]}</span>
          </button>
        </Tip>
      ))}
    </div>
  );
}
