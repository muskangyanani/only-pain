"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ghost, UserRound, Hash, ChevronDown, EyeOff, Check } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { CONTENT_WARNINGS, CW_LABELS, LIMITS, TAGS, detectCrisis } from "@/lib/constants";
import type { Circle, Post, Safety } from "@/lib/types";
import { prependPostToFeeds } from "@/lib/cache";
import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/use-me";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "@/components/ui/dropdown-menu";
import { Tip } from "@/components/ui/popover";
import { TagChip } from "./tag-chip";
import { CrisisResources, SafetyNotice } from "@/components/misc/crisis-resources";

type FixedCircle = { id: string; name: string; emoji: string } | null;

export function PostComposer({
  circle: fixedCircle = null,
  onPosted,
  autoFocus,
  variant = "inline",
  className,
}: {
  circle?: FixedCircle;
  onPosted?: (post: Post) => void;
  autoFocus?: boolean;
  variant?: "inline" | "dialog";
  className?: string;
}) {
  const { me } = useMe();
  const qc = useQueryClient();
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [anonymous, setAnonymous] = React.useState(false);
  const [warning, setWarning] = React.useState<string | null>(null);
  const [circleId, setCircleId] = React.useState<string | null>(fixedCircle?.id ?? null);
  const [showTags, setShowTags] = React.useState(false);
  const [focused, setFocused] = React.useState(variant === "dialog");
  const [safetyOpen, setSafetyOpen] = React.useState(false);

  const myCircles = useQuery({ queryKey: qk.circles("", true), queryFn: () => api.get<Circle[]>("/api/circles?mine=1"), enabled: !!me && !fixedCircle });
  const chosenCircle = fixedCircle ?? myCircles.data?.find((c) => c.id === circleId) ?? null;
  const crisis = detectCrisis(content);
  const remaining = LIMITS.post - content.length;
  const expanded = focused || content.length > 0;

  const m = useMutation({
    mutationFn: () => api.raw<Post>("POST", "/api/posts", { content: content.trim(), tags, isAnonymous: anonymous, circleId, contentWarning: warning }),
    onSuccess: ({ data: post, envelope }) => {
      prependPostToFeeds(qc, post);
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["trending"] });
      setContent("");
      setTags([]);
      setWarning(null);
      setShowTags(false);
      setFocused(false);
      toast(anonymous ? "Posted anonymously." : "Posted.");
      const safety = envelope.safety as Safety | undefined;
      if (safety?.showResources) setSafetyOpen(true);
      onPosted?.(post);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!me) return null;

  const toggleTag = (t: string) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 3 ? [...prev, t] : prev));

  return (
    <div className={cn(variant === "inline" && "card p-4 sm:p-5", className)}>
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <Avatar user={me} size="md" anonymous={anonymous} />
        </div>
        <div className="min-w-0 flex-1">
          <Textarea
            autoGrow
            autoFocus={autoFocus}
            rows={expanded ? 3 : 1}
            value={content}
            onFocus={() => setFocused(true)}
            onChange={(e) => setContent(e.target.value.slice(0, LIMITS.post))}
            placeholder={chosenCircle ? `Say it to ${chosenCircle.name}…` : anonymous ? "Nobody will know it's you. What's really going on?" : "What's on your mind tonight?"}
            className="border-0 bg-transparent px-0 py-1 text-[16px] focus:bg-transparent focus:ring-0"
          />

          {crisis && <CrisisResources compact className="mt-2" title="Sounds like a lot right now" intro="Post whatever you need to. And if tonight is heavy, these are open." />}

          {expanded && (
            <div className="mt-2 animate-fade-in">
              {(showTags || tags.length > 0) && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {(showTags ? TAGS : tags).map((t) => (
                    <TagChip key={t} tag={t} size="sm" active={tags.includes(t)} onClick={() => toggleTag(t)} />
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                <Tip label={anonymous ? "Posting anonymously" : "Posting as yourself"}>
                  <button
                    type="button"
                    onClick={() => setAnonymous((v) => !v)}
                    className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors", anonymous ? "border-violet/40 bg-violet-soft text-violet" : "border-border text-fg-muted hover:bg-surface")}
                  >
                    {anonymous ? <Ghost className="size-4" /> : <UserRound className="size-4" />}
                    {anonymous ? "Anonymous" : "As you"}
                  </button>
                </Tip>
                <button
                  type="button"
                  onClick={() => setShowTags((v) => !v)}
                  className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors", showTags ? "border-ember/40 bg-ember-soft text-ember" : "border-border text-fg-muted hover:bg-surface")}
                >
                  <Hash className="size-4" /> {tags.length ? `${tags.length}/3 tags` : "Tags"}
                </button>
                <Menu>
                  <MenuTrigger asChild>
                    <button type="button" className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors", warning ? "border-gold/40 bg-gold-soft text-gold" : "border-border text-fg-muted hover:bg-surface")}>
                      <EyeOff className="size-4" /> {warning ? CW_LABELS[warning as keyof typeof CW_LABELS] : "Content note"}
                    </button>
                  </MenuTrigger>
                  <MenuContent align="start">
                    <MenuLabel>Give readers a heads-up</MenuLabel>
                    <MenuItem onSelect={() => setWarning(null)}>{!warning && <Check />} None</MenuItem>
                    {CONTENT_WARNINGS.map((w) => (
                      <MenuItem key={w} onSelect={() => setWarning(w)}>{warning === w && <Check />} {CW_LABELS[w]}</MenuItem>
                    ))}
                  </MenuContent>
                </Menu>
                {!fixedCircle && (myCircles.data?.length ?? 0) > 0 && (
                  <Menu>
                    <MenuTrigger asChild>
                      <button type="button" className={cn("inline-flex h-8 max-w-[180px] items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors", chosenCircle ? "border-sky/40 bg-sky-soft text-sky" : "border-border text-fg-muted hover:bg-surface")}>
                        <span className="truncate">{chosenCircle ? `${chosenCircle.emoji} ${chosenCircle.name}` : "Everyone"}</span>
                        <ChevronDown className="size-3.5" />
                      </button>
                    </MenuTrigger>
                    <MenuContent align="start">
                      <MenuLabel>Post to</MenuLabel>
                      <MenuItem onSelect={() => setCircleId(null)}>{!circleId && <Check />} Everyone</MenuItem>
                      {myCircles.data!.map((c) => (
                        <MenuItem key={c.id} onSelect={() => setCircleId(c.id)}>{circleId === c.id && <Check />} {c.emoji} {c.name}</MenuItem>
                      ))}
                    </MenuContent>
                  </Menu>
                )}
                <div className="ml-auto flex items-center gap-2.5">
                  <span className={cn("text-[12px] tabular-nums", remaining < 100 ? "text-rose" : "text-fg-subtle")}>{remaining < 300 ? remaining : ""}</span>
                  <Button size="sm" onClick={() => m.mutate()} disabled={!content.trim()} loading={m.isPending}>
                    {anonymous ? "Post anonymously" : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <SafetyNotice open={safetyOpen} onOpenChange={setSafetyOpen} />
    </div>
  );
}
