"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, Ellipsis, EyeOff, Flag, Link2, MessageCircle, Pencil, Trash2, Ban, ShieldAlert } from "lucide-react";
import type { Post } from "@/lib/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { CW_LABELS } from "@/lib/constants";
import { patchPostInCaches, removePostFromCaches } from "@/lib/cache";
import { useMe } from "@/hooks/use-me";
import { useGuestGate } from "@/components/misc/guest-gate";
import { Avatar, UserName } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/misc";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/dropdown-menu";
import { Tip } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ReportDialog } from "@/components/misc/report-dialog";
import { ReactionBar } from "./reaction-bar";
import { CircleChip, TagChip } from "./tag-chip";

export function ContentWarningVeil({ warning, children, className }: { warning: string | null; children: React.ReactNode; className?: string }) {
  const [revealed, setRevealed] = React.useState(false);
  if (!warning || revealed) return <>{children}</>;
  const label = CW_LABELS[warning as keyof typeof CW_LABELS] ?? warning;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setRevealed(true);
      }}
      className={cn("mt-3 flex w-full items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-4 py-3.5 text-left transition-colors hover:bg-surface-2", className)}
    >
      <EyeOff className="size-4.5 shrink-0 text-fg-subtle" />
      <span className="text-[13.5px] text-fg-muted">
        <span className="font-medium text-fg">Content note: {label}.</span> Tap to read when you&apos;re ready.
      </span>
    </button>
  );
}

function PostMenu({ post }: { post: Post }) {
  const qc = useQueryClient();
  const router = useRouter();
  const { me } = useMe();
  const gate = useGuestGate();
  const [report, setReport] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(post.content);

  const del = useMutation({
    mutationFn: () => api.delete(`/api/posts/${post.id}`),
    onSuccess: () => {
      removePostFromCaches(qc, post.id);
      toast("Post deleted.");
      setConfirmDelete(false);
      if (window.location.pathname === `/post/${post.id}`) router.push("/home");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const edit = useMutation({
    mutationFn: () => api.patch<Post>(`/api/posts/${post.id}`, { content: draft.trim(), tags: post.tags, contentWarning: post.contentWarning }),
    onSuccess: (updated) => {
      patchPostInCaches(qc, post.id, { content: updated.content, editedAt: updated.editedAt });
      setEditing(false);
      toast("Updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const block = useMutation({
    mutationFn: () => api.post<{ blocked: boolean }>(`/api/users/${post.author.id}/block`),
    onSuccess: (r) => {
      toast(r.blocked ? "Blocked. You won't see each other." : "Unblocked.");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
  const copy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast("Link copied.");
  };
  const canModerate = me?.role === "MOD" || me?.role === "ADMIN";

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <button className="-mr-2 -mt-1 rounded-full p-2 text-fg-subtle transition-colors hover:bg-surface hover:text-fg" aria-label="Post options" onClick={(e) => e.stopPropagation()}>
            <Ellipsis className="size-[18px]" />
          </button>
        </MenuTrigger>
        <MenuContent onClick={(e) => e.stopPropagation()}>
          <MenuItem onSelect={copy}><Link2 /> Copy link</MenuItem>
          {post.isMine ? (
            <>
              <MenuItem onSelect={() => { setDraft(post.content); setEditing(true); }}><Pencil /> Edit</MenuItem>
              <MenuSeparator />
              <MenuItem danger onSelect={() => setConfirmDelete(true)}><Trash2 /> Delete</MenuItem>
            </>
          ) : (
            <>
              <MenuItem onSelect={() => gate("report posts", () => setReport(true))}><Flag /> Report</MenuItem>
              {!post.isAnonymous && post.author.id && <MenuItem danger onSelect={() => gate("block people", () => block.mutate())}><Ban /> Block @{post.author.username}</MenuItem>}
              {canModerate && (
                <>
                  <MenuSeparator />
                  <MenuItem danger onSelect={() => del.mutate()}><ShieldAlert /> Remove (mod)</MenuItem>
                </>
              )}
            </>
          )}
        </MenuContent>
      </Menu>
      <ReportDialog open={report} onOpenChange={setReport} target={{ postId: post.id }} />
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>It&apos;ll be gone for good, along with its comments.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Keep it</Button>
            <Button variant="danger" onClick={() => del.mutate()} loading={del.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
          </DialogHeader>
          <Textarea autoGrow rows={5} value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 2000))} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={() => edit.mutate()} loading={edit.isPending} disabled={!draft.trim() || draft.trim() === post.content}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BookmarkButton({ post }: { post: Post }) {
  const qc = useQueryClient();
  const gate = useGuestGate();
  const m = useMutation({
    mutationFn: () => api.post<{ bookmarked: boolean }>(`/api/posts/${post.id}/bookmark`),
    onMutate: () => patchPostInCaches(qc, post.id, { isBookmarked: !post.isBookmarked }),
    onSuccess: (r) => {
      patchPostInCaches(qc, post.id, { isBookmarked: r.bookmarked });
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
      toast(r.bookmarked ? "Saved for later." : "Removed from saved.");
    },
    onError: () => patchPostInCaches(qc, post.id, { isBookmarked: post.isBookmarked }),
  });
  return (
    <Tip label={post.isBookmarked ? "Saved" : "Save"}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          gate("save posts", () => m.mutate());
        }}
        className={cn("inline-flex size-8.5 items-center justify-center rounded-full transition-colors hover:bg-surface", post.isBookmarked ? "text-ember" : "text-fg-subtle hover:text-fg")}
        aria-label="Save"
      >
        {post.isBookmarked ? <BookmarkCheck className="size-[18px]" /> : <Bookmark className="size-[18px]" />}
      </button>
    </Tip>
  );
}

export function PostCard({ post, detail, className }: { post: Post; detail?: boolean; className?: string }) {
  const router = useRouter();
  const href = `/post/${post.id}`;
  const long = !detail && post.content.length > 560;
  const profileHref = post.isAnonymous || !post.author.id ? null : `/u/${post.author.username}`;

  const goToPost = (e: React.MouseEvent) => {
    if (detail) return;
    const t = e.target as HTMLElement;
    if (t.closest("a,button,[role=menu],[data-no-nav]")) return;
    router.push(href);
  };

  return (
    <article
      onClick={goToPost}
      className={cn("card group relative p-4 transition-[box-shadow,transform] sm:p-5", !detail && "cursor-pointer hover:shadow-pop", className)}
    >
      <header className="flex items-start gap-3">
        {profileHref ? (
          <Link href={profileHref} className="shrink-0"><Avatar user={post.author} size="md" /></Link>
        ) : (
          <Avatar anonymous size="md" />
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] leading-tight">
            {profileHref ? (
              <Link href={profileHref} className="min-w-0 hover:underline"><UserName user={post.author} /></Link>
            ) : (
              <UserName user={post.author} anonymous />
            )}
            {post.isAnonymous && post.isMine && <Badge tone="violet">you, anonymously</Badge>}
            <span className="text-fg-subtle">·</span>
            <Tip label={new Date(post.createdAt).toLocaleString()}>
              <time className="text-[13px] text-fg-subtle" dateTime={post.createdAt}>{timeAgo(post.createdAt)}{post.editedAt ? " · edited" : ""}</time>
            </Tip>
            {post.circle && <CircleChip circle={post.circle} size="sm" className="ml-0.5" />}
          </div>
          {post.moderation !== "VISIBLE" && <Badge tone="rose" className="mt-1.5"><ShieldAlert className="size-3" /> Hidden while a moderator reviews it</Badge>}
        </div>
        <PostMenu post={post} />
      </header>

      <ContentWarningVeil warning={post.contentWarning}>
        <div className={cn("mt-3 whitespace-pre-wrap break-words text-[15.5px] leading-[1.62] text-fg text-pretty", long && "line-clamp-[9]")}>{post.content}</div>
        {long && <Link href={href} className="mt-1 inline-block text-[13.5px] font-medium text-ember hover:underline">Read the rest</Link>}
      </ContentWarningVeil>

      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((t) => <TagChip key={t} tag={t} size="sm" />)}
        </div>
      )}

      <footer className="mt-4 flex items-center gap-1.5" data-no-nav>
        <ReactionBar post={post} />
        <div className="ml-auto flex items-center gap-0.5">
          <Tip label="Comments">
            <Link href={href} className="inline-flex h-8.5 items-center gap-1.5 rounded-full px-2.5 text-[13px] tabular-nums text-fg-subtle transition-colors hover:bg-surface hover:text-fg">
              <MessageCircle className="size-[18px]" />
              <span>{post.commentCount}</span>
            </Link>
          </Tip>
          <BookmarkButton post={post} />
        </div>
      </footer>
    </article>
  );
}

export function PostSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton size-10 rounded-full" />
        <div className="space-y-2">
          <div className="skeleton h-3.5 w-32" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-[92%]" />
        <div className="skeleton h-3.5 w-[70%]" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-8 w-20 rounded-full" />
        <div className="skeleton h-8 w-12 rounded-full" />
      </div>
    </div>
  );
}
