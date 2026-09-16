"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ghost, UserRound, Reply, Trash2, Sparkles, Flag, MessagesSquare } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { LIMITS, detectCrisis } from "@/lib/constants";
import type { Comment, Safety } from "@/lib/types";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { patchPostInCaches } from "@/lib/cache";
import { useMe } from "@/hooks/use-me";
import { useInfinitePage, useLoadMore } from "@/hooks/use-infinite-page";
import { useGuestGate } from "@/components/misc/guest-gate";
import { Avatar, UserName } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { EmptyState, Spinner } from "@/components/ui/misc";
import { ReportDialog } from "@/components/misc/report-dialog";
import { CrisisResources, SafetyNotice } from "@/components/misc/crisis-resources";

function CommentComposer({ postId, parentId, placeholder, onDone, autoFocus, compact }: { postId: string; parentId?: string; placeholder?: string; onDone?: () => void; autoFocus?: boolean; compact?: boolean }) {
  const { me } = useMe();
  const qc = useQueryClient();
  const gate = useGuestGate();
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [anonymous, setAnonymous] = React.useState(false);
  const [ideas, setIdeas] = React.useState<string[] | null>(null);
  const [safetyOpen, setSafetyOpen] = React.useState(false);

  const m = useMutation({
    mutationFn: () => api.raw<Comment>("POST", `/api/posts/${postId}/comments`, { content: content.trim(), isAnonymous: anonymous, parentCommentId: parentId ?? null }),
    onSuccess: ({ envelope }) => {
      setContent("");
      setIdeas(null);
      qc.invalidateQueries({ queryKey: qk.comments(postId) });
      patchPostInCaches(qc, postId, (p) => ({ ...p, commentCount: p.commentCount + 1 }));
      if ((envelope.safety as Safety | undefined)?.showResources) setSafetyOpen(true);
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const ideaM = useMutation({
    mutationFn: () => api.post<string[]>(`/api/posts/${postId}/reply-ideas`),
    onSuccess: setIdeas,
    onError: (e: ApiError) => (e.isQuota ? toast(e.message, { action: { label: "See Plus", onClick: () => router.push("/plus") } }) : toast.error(e.message)),
  });

  if (!me) {
    return (
      <button type="button" onClick={() => gate("comment", () => {})} className="w-full rounded-2xl border border-dashed border-border-strong px-4 py-3 text-left text-sm text-fg-muted transition-colors hover:bg-surface">
        Log in to reply — or just read. Both are okay.
      </button>
    );
  }

  return (
    <div className={cn("flex gap-3", compact && "gap-2.5")}>
      <Avatar user={me} size={compact ? "sm" : "md"} anonymous={anonymous} className="mt-1" />
      <div className="min-w-0 flex-1">
        <Textarea
          autoGrow
          autoFocus={autoFocus}
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, LIMITS.comment))}
          placeholder={placeholder ?? "Say something kind. Or just 'same'."}
          className="text-[14.5px]"
        />
        {detectCrisis(content) && <CrisisResources compact className="mt-2" title="Sounds like a lot right now" />}
        {ideas && (
          <div className="mt-2 space-y-1.5 rounded-xl border border-violet/30 bg-violet-soft/60 p-2.5">
            <p className="flex items-center gap-1.5 px-1 text-[11.5px] font-semibold uppercase tracking-wider text-violet"><Sparkles className="size-3.5" /> Ember&apos;s starters — make them yours</p>
            {ideas.map((idea, i) => (
              <button key={i} type="button" onClick={() => setContent(idea)} className="block w-full rounded-lg bg-bg-elevated/80 px-3 py-2 text-left text-[13.5px] text-fg transition-colors hover:bg-bg-elevated">
                {idea}
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setAnonymous((v) => !v)} className={cn("inline-flex h-7.5 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium transition-colors", anonymous ? "border-violet/40 bg-violet-soft text-violet" : "border-border text-fg-muted hover:bg-surface")}>
            {anonymous ? <Ghost className="size-3.5" /> : <UserRound className="size-3.5" />} {anonymous ? "Anonymous" : "As you"}
          </button>
          {!parentId && (
            <Button variant="ghost" size="xs" onClick={() => ideaM.mutate()} loading={ideaM.isPending} className="text-violet hover:bg-violet-soft hover:text-violet">
              <Sparkles /> Not sure what to say?
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {onDone && <Button variant="ghost" size="sm" onClick={onDone}>Cancel</Button>}
            <Button size="sm" onClick={() => m.mutate()} disabled={!content.trim()} loading={m.isPending}>{parentId ? "Reply" : "Comment"}</Button>
          </div>
        </div>
      </div>
      <SafetyNotice open={safetyOpen} onOpenChange={setSafetyOpen} />
    </div>
  );
}

function CommentItem({ comment, postId, onReply, depth = 0 }: { comment: Comment; postId: string; onReply?: (id: string) => void; depth?: number }) {
  const { me } = useMe();
  const qc = useQueryClient();
  const gate = useGuestGate();
  const [report, setReport] = React.useState(false);
  const canDelete = comment.isMine || me?.role === "MOD" || me?.role === "ADMIN";
  const del = useMutation({
    mutationFn: () => api.delete(`/api/posts/comments/${comment.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.comments(postId) });
      patchPostInCaches(qc, postId, (p) => ({ ...p, commentCount: Math.max(0, p.commentCount - 1 - (comment.replies?.length ?? 0)) }));
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const profile = !comment.isAnonymous && comment.author.id ? `/u/${comment.author.username}` : null;
  return (
    <div className={cn("flex gap-3", depth > 0 && "gap-2.5")}>
      {profile ? <Link href={profile}><Avatar user={comment.author} size={depth ? "sm" : "md"} /></Link> : <Avatar anonymous size={depth ? "sm" : "md"} />}
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md bg-surface px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-x-2 text-[13px] leading-tight">
            {profile ? <Link href={profile} className="hover:underline"><UserName user={comment.author} /></Link> : <UserName user={comment.author} anonymous />}
            {comment.isAnonymous && comment.isMine && <span className="text-[11.5px] text-violet">you</span>}
            <time className="text-[12px] text-fg-subtle">{timeAgo(comment.createdAt)}</time>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-[14.5px] leading-relaxed text-fg">{comment.content}</p>
        </div>
        <div className="mt-1 flex items-center gap-0.5 pl-1">
          {onReply && (
            <button type="button" onClick={() => gate("reply", () => onReply(comment.id))} className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[12px] font-medium text-fg-subtle hover:bg-surface hover:text-fg">
              <Reply className="size-3.5" /> Reply
            </button>
          )}
          {!comment.isMine && (
            <button type="button" onClick={() => gate("report", () => setReport(true))} className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[12px] text-fg-subtle hover:bg-surface hover:text-fg">
              <Flag className="size-3.5" />
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={() => del.mutate()} className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[12px] text-fg-subtle hover:bg-rose-soft hover:text-rose">
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
        <ReportDialog open={report} onOpenChange={setReport} target={{ commentId: comment.id }} />
      </div>
    </div>
  );
}

export function CommentThread({ postId, commentCount }: { postId: string; commentCount: number }) {
  const q = useInfinitePage<Comment>(qk.comments(postId), `/api/posts/${postId}/comments`, { limit: 30 });
  const sentinel = useLoadMore(q);
  const [replyTo, setReplyTo] = React.useState<string | null>(null);

  return (
    <section className="space-y-5" id="comments">
      <h2 className="flex items-center gap-2 font-display text-[19px] text-fg">
        <MessagesSquare className="size-5 text-fg-subtle" /> {commentCount === 0 ? "No replies yet" : `${commentCount} ${commentCount === 1 ? "reply" : "replies"}`}
      </h2>
      <CommentComposer postId={postId} />
      {q.isPending ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : q.items.length === 0 ? (
        <EmptyState title="Be the first to say something" body="A single 'I hear you' counts more than you'd think." className="py-8" />
      ) : (
        <div className="space-y-5">
          {q.items.map((c) => (
            <div key={c.id} className="space-y-3">
              <CommentItem comment={c} postId={postId} onReply={setReplyTo} />
              {(c.replies?.length ?? 0) > 0 && (
                <div className="ml-6 space-y-3 border-l-2 border-border pl-4 sm:ml-12">
                  {c.replies!.map((r) => <CommentItem key={r.id} comment={r} postId={postId} onReply={setReplyTo} depth={1} />)}
                </div>
              )}
              {replyTo === c.id && (
                <div className="ml-6 border-l-2 border-ember/40 pl-4 sm:ml-12">
                  <CommentComposer postId={postId} parentId={c.id} placeholder={`Reply to ${c.isAnonymous ? "this" : c.author.displayName || c.author.username}…`} autoFocus compact onDone={() => setReplyTo(null)} />
                </div>
              )}
              {c.replies?.some((r) => r.id === replyTo) && (
                <div className="ml-6 border-l-2 border-ember/40 pl-4 sm:ml-12">
                  <CommentComposer postId={postId} parentId={replyTo!} placeholder="Reply…" autoFocus compact onDone={() => setReplyTo(null)} />
                </div>
              )}
            </div>
          ))}
          <div ref={sentinel} />
          {q.isFetchingNextPage && <div className="flex justify-center py-4"><Spinner /></div>}
        </div>
      )}
    </section>
  );
}
