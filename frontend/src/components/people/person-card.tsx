"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle, UserPlus, Check } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { TAG_LABELS, type Tag } from "@/lib/constants";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useGuestGate } from "@/components/misc/guest-gate";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";

export function FollowButton({ userId, initial, size = "sm", onChange, className }: { userId: string; initial: boolean; size?: "xs" | "sm" | "md"; onChange?: (v: boolean) => void; className?: string }) {
  const [following, setFollowing] = React.useState(initial);
  const [prevInitial, setPrevInitial] = React.useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setFollowing(initial);
  }
  const gate = useGuestGate();
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => api.post<{ following: boolean }>(`/api/users/${userId}/follow`),
    onMutate: () => setFollowing((v) => !v),
    onSuccess: (r) => {
      setFollowing(r.following);
      onChange?.(r.following);
      qc.invalidateQueries({ queryKey: ["people"] });
      qc.invalidateQueries({ queryKey: ["feed", "following"] });
    },
    onError: (e: Error) => {
      setFollowing((v) => !v);
      toast.error(e.message);
    },
  });
  return (
    <Button size={size} variant={following ? "outline" : "soft"} className={className} onClick={() => gate("follow people", () => m.mutate())}>
      {following ? <><Check /> Following</> : <><UserPlus /> Follow</>}
    </Button>
  );
}

export function MessageButton({ user, size = "sm", variant = "outline", className, label = "Message" }: { user: { id: string; username: string; displayName?: string | null }; size?: "xs" | "sm" | "md"; variant?: "outline" | "soft" | "primary" | "ghost"; className?: string; label?: string }) {
  const [open, setOpen] = React.useState(false);
  const [content, setContent] = React.useState("");
  const router = useRouter();
  const gate = useGuestGate();
  const m = useMutation({
    mutationFn: () => api.post<{ conversation: { id: string; status: string }; created: boolean }>("/api/dm/conversations", { userId: user.id, content: content.trim() }),
    onSuccess: (r) => {
      setOpen(false);
      setContent("");
      toast(r.conversation.status === "PENDING" ? "Request sent. They'll see it in their requests." : "Sent.");
      router.push(`/messages/${r.conversation.id}`);
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
  return (
    <>
      <Button size={size} variant={variant} className={className} onClick={() => gate("send messages", () => setOpen(true))}><MessageCircle /> {label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {user.displayName || `@${user.username}`}</DialogTitle>
            <DialogDescription>This goes in as a request. They can accept, decline, or just not reply — all of those are okay.</DialogDescription>
          </DialogHeader>
          <Textarea autoGrow autoFocus rows={3} value={content} onChange={(e) => setContent(e.target.value.slice(0, 2000))} placeholder="Hi — your post about … stuck with me." />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => m.mutate()} disabled={!content.trim()} loading={m.isPending}>Send request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PersonRow({ person, compact, showMessage }: { person: Person; compact?: boolean; showMessage?: boolean }) {
  if (!person.id) return null;
  const shared = person.sharedStruggles ?? [];
  return (
    <div className={cn("flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2", !compact && "card-flat p-3.5 hover:bg-surface")}>
      <Link href={`/u/${person.username}`} className="shrink-0"><Avatar user={{ ...person, username: person.username }} size={compact ? "md" : "lg"} /></Link>
      <div className="min-w-0 flex-1">
        <Link href={`/u/${person.username}`} className="block truncate text-[14px] font-semibold text-fg hover:underline">{person.displayName || person.username}</Link>
        {shared.length > 0 ? (
          <p className="truncate text-[12px] text-fg-muted">also carrying <span className="text-ember">{shared.map((s) => TAG_LABELS[s as Tag] ?? s).join(", ")}</span></p>
        ) : person.bio ? (
          <p className="truncate text-[12px] text-fg-muted">{person.bio}</p>
        ) : (
          <p className="truncate text-[12px] text-fg-subtle">@{person.username}</p>
        )}
        {!compact && person.bio && shared.length > 0 && <p className="mt-1 line-clamp-2 text-[13px] text-fg-muted">{person.bio}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {showMessage && <MessageButton user={{ id: person.id, username: person.username, displayName: person.displayName }} size="xs" variant="ghost" label="" className="px-2" />}
        <FollowButton userId={person.id} initial={false} size={compact ? "xs" : "sm"} />
      </div>
    </div>
  );
}
