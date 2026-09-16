"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HandHeart, MessageCircle, Reply, UserPlus, Users, Inbox, Check, Mail, LifeBuoy, Bell } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { Avatar } from "@/components/ui/avatar";
import { CrisisResources } from "@/components/misc/crisis-resources";

const META: Record<Notification["type"], { icon: React.ElementType; tone: string; text: (n: Notification) => string; href: (n: Notification) => string | null }> = {
  COMMENT: { icon: MessageCircle, tone: "text-sky bg-sky-soft", text: () => "commented on your post", href: (n) => (n.post ? `/post/${n.post.id}#comments` : null) },
  REPLY: { icon: Reply, tone: "text-sky bg-sky-soft", text: () => "replied to your comment", href: (n) => (n.post ? `/post/${n.post.id}#comments` : null) },
  REACTION: { icon: HandHeart, tone: "text-ember bg-ember-soft", text: () => "reacted to your post", href: (n) => (n.post ? `/post/${n.post.id}` : null) },
  FOLLOW: { icon: UserPlus, tone: "text-violet bg-violet-soft", text: () => "started following you", href: (n) => (n.actor.id ? `/u/${n.actor.username}` : null) },
  CIRCLE_JOIN: { icon: Users, tone: "text-sage bg-sage-soft", text: (n) => `joined ${n.circle?.name ?? "your circle"}`, href: (n) => (n.circle ? `/circles/${n.circle.slug}` : null) },
  DM_REQUEST: { icon: Inbox, tone: "text-gold bg-gold-soft", text: () => "sent you a message request", href: (n) => (n.conversationId ? `/messages/${n.conversationId}` : "/messages") },
  DM_ACCEPTED: { icon: Check, tone: "text-sage bg-sage-soft", text: () => "accepted your message request", href: (n) => (n.conversationId ? `/messages/${n.conversationId}` : "/messages") },
  DM_MESSAGE: { icon: Mail, tone: "text-sky bg-sky-soft", text: () => "sent you a message", href: (n) => (n.conversationId ? `/messages/${n.conversationId}` : "/messages") },
  SUPPORT: { icon: LifeBuoy, tone: "text-ember bg-ember-soft", text: () => "", href: () => null },
  SYSTEM: { icon: Bell, tone: "text-fg-muted bg-surface", text: () => "", href: () => null },
};

export function NotificationItem({ n }: { n: Notification }) {
  const qc = useQueryClient();
  const meta = META[n.type];
  const Icon = meta.icon;
  const href = meta.href(n);
  const read = useMutation({
    mutationFn: () => api.patch(`/api/notifications/${n.id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications });
      qc.invalidateQueries({ queryKey: qk.unread });
    },
  });
  const actorName = n.actor.id ? n.actor.displayName || n.actor.username : "Someone";

  if (n.type === "SUPPORT") {
    return (
      <div className={cn("rounded-2xl", !n.isRead && "ring-1 ring-ember/30")} onClick={() => !n.isRead && read.mutate()}>
        <CrisisResources title="A note from only pain" intro={n.message ?? undefined} />
      </div>
    );
  }

  const body = (
    <div className={cn("flex items-start gap-3 rounded-2xl p-3.5 transition-colors", n.isRead ? "hover:bg-surface/70" : "bg-surface hover:bg-surface-2")}>
      <div className="relative shrink-0">
        <Avatar user={n.actor.id ? { username: n.actor.username, displayName: n.actor.displayName, avatarUrl: n.actor.avatarUrl } : null} anonymous={!n.actor.id} size="md" />
        <span className={cn("absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ring-2 ring-bg", meta.tone)}><Icon className="size-3" /></span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-fg"><span className="font-semibold">{actorName}</span> {meta.text(n)}</p>
        {(n.comment?.preview || n.post?.preview) && <p className="mt-0.5 line-clamp-2 text-[13px] text-fg-muted">“{n.comment?.preview ?? n.post?.preview}”</p>}
        <p className="mt-1 text-[11.5px] text-fg-subtle">{timeAgo(n.createdAt)}</p>
      </div>
      {!n.isRead && <span className="mt-2 size-2 shrink-0 rounded-full bg-ember" />}
    </div>
  );
  return href ? (
    <Link href={href} onClick={() => !n.isRead && read.mutate()}>{body}</Link>
  ) : (
    <div onClick={() => !n.isRead && read.mutate()}>{body}</div>
  );
}
