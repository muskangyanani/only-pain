"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, Check, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { TAGS, TAG_LABELS, type Tag } from "@/lib/constants";
import type { Circle } from "@/lib/types";
import { cn, hueFrom } from "@/lib/utils";
import { useGuestGate } from "@/components/misc/guest-gate";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { TagChip } from "@/components/post/tag-chip";

export function useJoinCircle(slug: string) {
  const qc = useQueryClient();
  const gate = useGuestGate();
  const m = useMutation({
    mutationFn: (join: boolean) => api.post<{ joined: boolean }>(`/api/circles/${slug}/${join ? "join" : "leave"}`),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["circles"] });
      qc.invalidateQueries({ queryKey: ["circle", slug] });
      qc.invalidateQueries({ queryKey: ["suggested-circles"] });
      qc.invalidateQueries({ queryKey: ["feed", "foryou"] });
      toast(r.joined ? "You're in. Welcome." : "Left the circle.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return { toggle: (join: boolean) => gate("join circles", () => m.mutate(join)), isPending: m.isPending };
}

export function JoinButton({ circle, size = "sm" }: { circle: Circle; size?: "xs" | "sm" | "md" | "lg" }) {
  const { toggle, isPending } = useJoinCircle(circle.slug);
  if (circle.myRole === "OWNER") return <Button size={size} variant="outline" disabled>Owner</Button>;
  return (
    <Button size={size} variant={circle.isMember ? "outline" : "soft"} loading={isPending} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(!circle.isMember); }}>
      {circle.isMember ? <><Check /> Joined</> : <><Plus /> Join</>}
    </Button>
  );
}

export function CircleCard({ circle, className }: { circle: Circle; className?: string }) {
  return (
    <Link href={`/circles/${circle.slug}`} className={cn("card group relative flex flex-col overflow-hidden p-4 transition-shadow hover:shadow-pop", className)}>
      <div className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full opacity-60 blur-3xl transition-opacity group-hover:opacity-90" style={{ background: `oklch(0.7 0.14 ${circle.hue} / 0.5)` }} />
      <div className="relative flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ background: `oklch(0.7 0.12 ${circle.hue} / 0.18)` }}>{circle.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[19px] leading-tight text-fg">{circle.name}</p>
          <p className="mt-0.5 text-[13.5px] text-fg-muted">{circle.tagline}</p>
        </div>
      </div>
      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {circle.tags.slice(0, 3).map((t) => <span key={t} className="rounded-full bg-surface px-2 py-0.5 text-[11.5px] font-medium text-fg-muted">#{TAG_LABELS[t as Tag] ?? t}</span>)}
      </div>
      <div className="relative mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-fg-subtle"><Users className="size-3.5" /> {circle.memberCount} · {circle.postCount} posts</span>
        <JoinButton circle={circle} size="xs" />
      </div>
    </Link>
  );
}

const EMOJIS = ["🫂", "🌙", "🔥", "🕯️", "🌊", "🌱", "🧠", "✨", "☕", "🌧️", "🪴", "🧸", "🎧", "📓", "🕊️", "🫧"];

export function CreateCircleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [tagline, setTagline] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [emoji, setEmoji] = React.useState("🫂");
  const [hueOverride, setHue] = React.useState<number | null>(null);
  const hue = hueOverride ?? hueFrom(name || "only pain");
  const [tags, setTags] = React.useState<string[]>([]);
  const m = useMutation({
    mutationFn: () => api.post<Circle>("/api/circles", { name, tagline, description: description || null, emoji, hue, tags }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["circles"] });
      onOpenChange(false);
      toast("Circle created.");
      router.push(`/circles/${c.slug}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Start a circle</DialogTitle>
          <DialogDescription>A small room for a specific kind of heavy. You&apos;ll be its owner and first moderator.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-3xl" style={{ background: `oklch(0.7 0.12 ${hue} / 0.2)` }}>{emoji}</span>
            <div className="flex flex-wrap gap-1">
              {EMOJIS.map((e) => <button key={e} type="button" onClick={() => setEmoji(e)} className={cn("size-8 rounded-lg text-lg hover:bg-surface", emoji === e && "bg-surface-2")}>{e}</button>)}
            </div>
          </div>
          <Field label="Colour"><input type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} className="w-full accent-[var(--ember)]" /></Field>
          <Field label="Name" hint="3–40 characters"><Input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="e.g. night shift nurses" /></Field>
          <Field label="One line about it"><Input value={tagline} onChange={(e) => setTagline(e.target.value.slice(0, 120))} placeholder="For the ones holding everyone else together." /></Field>
          <Field label="Description (optional)"><Textarea autoGrow rows={3} value={description} onChange={(e) => setDescription(e.target.value.slice(0, 1000))} placeholder="Who it's for, what's welcome, what isn't." /></Field>
          <Field label="Tags (up to 4)">
            <div className="flex flex-wrap gap-1.5">{TAGS.map((t) => <TagChip key={t} tag={t} size="sm" active={tags.includes(t)} onClick={() => setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : p.length < 4 ? [...p, t] : p))} />)}</div>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => m.mutate()} disabled={name.trim().length < 3 || tagline.trim().length < 3} loading={m.isPending}>Create circle</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
