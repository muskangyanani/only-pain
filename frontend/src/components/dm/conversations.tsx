"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Inbox, Send, Check, X, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Conversation, Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { timeAgo, timeOfDay } from "@/lib/time";
import { useMe } from "@/hooks/use-me";
import { useInfinitePage } from "@/hooks/use-infinite-page";
import { getSocket, useSocketEvent } from "@/hooks/use-socket";
import { useNow } from "@/hooks/use-now";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { EmptyState, Segmented, Spinner } from "@/components/ui/misc";

export function ConversationList({ className }: { className?: string }) {
  const [filter, setFilter] = React.useState<"inbox" | "requests">("inbox");
  const pathname = usePathname();
  const now = useNow();
  const q = useQuery({ queryKey: qk.conversations(filter), queryFn: () => api.get<Conversation[]>(`/api/dm/conversations?filter=${filter}`), refetchInterval: 45_000 });
  const unread = useQuery({ queryKey: qk.dmUnread, queryFn: () => api.get<{ messages: number; requests: number }>("/api/dm/unread") });
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-center justify-between pb-3">
        <h1 className="font-display text-[24px] text-fg">Messages</h1>
        <Segmented size="sm" value={filter} onChange={setFilter} options={[{ value: "inbox", label: "Inbox" }, { value: "requests", label: <span className="inline-flex items-center gap-1">Requests {unread.data?.requests ? <span className="rounded-full bg-ember px-1.5 text-[10px] font-bold text-ember-fg">{unread.data.requests}</span> : null}</span> }]} />
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {q.isPending ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : q.data!.length === 0 ? (
          <EmptyState icon={filter === "requests" ? <Inbox /> : <MessageCircle />} title={filter === "requests" ? "No requests" : "No conversations yet"} body={filter === "requests" ? "When someone reaches out, you'll decide here whether to let them in." : "Find someone who gets it in Explore, or reply to a post that moved you."} className="py-10" />
        ) : (
          q.data!.map((c) => {
            const active = pathname === `/messages/${c.id}`;
            return (
              <Link key={c.id} href={`/messages/${c.id}`} className={cn("flex items-center gap-3 rounded-2xl p-3 transition-colors", active ? "bg-surface" : "hover:bg-surface/70")}>
                <div className="relative shrink-0">
                  <Avatar user={c.other} size="md" />
                  {now - new Date(c.other.lastActiveAt).getTime() < 10 * 60_000 && <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-sage ring-2 ring-bg" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn("truncate text-[14px]", c.unread ? "font-semibold text-fg" : "font-medium text-fg")}>{c.other.displayName || c.other.username}</p>
                    {c.lastMessageAt && <span className="shrink-0 text-[11.5px] text-fg-subtle">{timeAgo(c.lastMessageAt)}</span>}
                  </div>
                  <p className={cn("truncate text-[13px]", c.unread ? "text-fg" : "text-fg-muted")}>{c.status === "PENDING" && c.isInitiator ? "Request sent · " : ""}{c.lastMessagePreview}</p>
                </div>
                {c.unread > 0 && <span className="size-2.5 shrink-0 rounded-full bg-ember" />}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export function ConversationView({ id }: { id: string }) {
  const { me } = useMe();
  const qc = useQueryClient();
  const router = useRouter();
  const convo = useQuery({ queryKey: qk.conversation(id), queryFn: () => api.get<Conversation>(`/api/dm/conversations/${id}`) });
  const msgs = useInfinitePage<Message>(qk.messages(id), `/api/dm/conversations/${id}/messages`, { limit: 40 });
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const bottom = React.useRef<HTMLDivElement>(null);
  const typingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = React.useRef(0);

  // Pages arrive newest-first (cursor pagination), each page oldest→newest inside.
  const ordered = React.useMemo(() => [...(msgs.data?.pages ?? [])].reverse().flatMap((p) => p.data), [msgs.data]);

  React.useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [ordered.length]);

  React.useEffect(() => {
    if (!convo.data || convo.data.unread === 0) return;
    api.post(`/api/dm/conversations/${id}/read`).then(() => {
      qc.invalidateQueries({ queryKey: qk.dmUnread });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    });
  }, [convo.data, id, qc, ordered.length]);

  useSocketEvent<{ conversationId: string; typing: boolean }>("dm:typing", (p) => {
    if (p.conversationId !== id) return;
    setTyping(p.typing);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (p.typing) typingTimer.current = setTimeout(() => setTyping(false), 4000);
  });

  const send = useMutation({
    mutationFn: () => api.post<Message>(`/api/dm/conversations/${id}/messages`, { content: draft.trim() }),
    onSuccess: () => {
      setDraft("");
      getSocket()?.emit("dm:typing", { conversationId: id, typing: false });
      qc.invalidateQueries({ queryKey: qk.messages(id) });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: qk.conversation(id) });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const respond = useMutation({
    mutationFn: (accept: boolean) => api.post<Conversation>(`/api/dm/conversations/${id}/${accept ? "accept" : "decline"}`),
    onSuccess: (c, accept) => {
      qc.setQueryData(qk.conversation(id), c);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: qk.dmUnread });
      toast(accept ? "Accepted. Say hi." : "Declined.");
      if (!accept) router.push("/messages");
    },
  });

  const onType = (v: string) => {
    setDraft(v);
    const now = Date.now();
    if (now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      getSocket()?.emit("dm:typing", { conversationId: id, typing: true });
    }
  };

  if (convo.isPending) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (convo.isError || !convo.data) return <EmptyState title="Conversation not found" />;
  const c = convo.data;
  const pendingForMe = c.status === "PENDING" && !c.isInitiator;
  const canSend = c.status === "ACCEPTED" || pendingForMe;

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col md:h-[calc(100dvh-2.5rem)]">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Link href="/messages" className="rounded-full p-1.5 text-fg-muted hover:bg-surface lg:hidden" aria-label="Back">←</Link>
        <Link href={`/u/${c.other.username}`}><Avatar user={c.other} size="md" /></Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${c.other.username}`} className="block truncate font-semibold text-fg hover:underline">{c.other.displayName || c.other.username}</Link>
          <p className="text-[12px] text-fg-subtle">{typing ? <span className="text-ember">typing…</span> : `@${c.other.username}`}</p>
        </div>
      </div>

      {pendingForMe && (
        <div className="mt-3 rounded-2xl border border-ember/30 bg-ember-soft/50 p-4">
          <p className="text-[14px] text-fg"><span className="font-semibold">{c.other.displayName || c.other.username}</span> wants to talk. You can accept, decline, or just leave it. No obligation either way.</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => respond.mutate(true)} loading={respond.isPending}><Check /> Accept</Button>
            <Button size="sm" variant="ghost" onClick={() => respond.mutate(false)}><X /> Decline</Button>
          </div>
        </div>
      )}
      {c.status === "PENDING" && c.isInitiator && <p className="mt-3 rounded-2xl bg-surface px-4 py-2.5 text-center text-[13px] text-fg-muted">Request sent. You&apos;ll be able to write more once they accept.</p>}
      {c.status === "DECLINED" && <p className="mt-3 rounded-2xl bg-surface px-4 py-2.5 text-center text-[13px] text-fg-muted">This conversation is closed.</p>}

      <div className="flex-1 space-y-2 overflow-y-auto py-4 pr-1">
        {msgs.hasNextPage && <div className="flex justify-center"><Button variant="ghost" size="xs" onClick={() => msgs.fetchNextPage()} loading={msgs.isFetchingNextPage}>Load earlier</Button></div>}
        {ordered.map((m, i) => {
          const mine = m.senderId === me?.id;
          const prev = ordered[i - 1];
          const showTime = !prev || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 20 * 60_000;
          return (
            <React.Fragment key={m.id}>
              {showTime && <p className="py-2 text-center text-[11px] text-fg-subtle">{timeOfDay(m.createdAt)} · {timeAgo(m.createdAt)}</p>}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-relaxed", mine ? "rounded-tr-md bg-ember text-ember-fg" : "rounded-tl-md bg-surface text-fg")}><p className="whitespace-pre-wrap break-words">{m.content}</p></div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottom} />
      </div>

      {canSend && (
        <div className="flex items-end gap-2 border-t border-border pt-3">
          <Textarea autoGrow rows={1} value={draft} onChange={(e) => onType(e.target.value.slice(0, 2000))} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (draft.trim()) send.mutate(); } }} placeholder={pendingForMe ? "Replying accepts the request…" : "Write a message"} className="max-h-40 text-[14.5px]" />
          <Button size="icon" onClick={() => send.mutate()} disabled={!draft.trim()} loading={send.isPending} aria-label="Send" className="mb-0.5 shrink-0"><Send /></Button>
        </div>
      )}
    </div>
  );
}
