"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ghost, Settings, Ellipsis, Flag, Ban, Crown, ShieldCheck, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { TAG_LABELS, type Tag } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { longDate, timeAgo } from "@/lib/time";
import { useMe } from "@/hooks/use-me";
import { useNow } from "@/hooks/use-now";
import { useGuestGate } from "@/components/misc/guest-gate";
import { Feed } from "@/components/feed/feed";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, Segmented, Skeleton } from "@/components/ui/misc";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/dropdown-menu";
import { FollowButton, MessageButton } from "@/components/people/person-card";
import { MoodRing } from "@/components/tools/mood";
import { ReportDialog } from "@/components/misc/report-dialog";

export function ProfileView({ username }: { username: string }) {
  const { me } = useMe();
  const qc = useQueryClient();
  const gate = useGuestGate();
  const [tab, setTab] = React.useState<"posts" | "anonymous">("posts");
  const [report, setReport] = React.useState(false);
  const now = useNow();
  const q = useQuery({ queryKey: qk.profile(username), queryFn: () => api.get<Profile>(`/api/users/${username}`), retry: false });
  const block = useMutation({
    mutationFn: (id: string) => api.post<{ blocked: boolean }>(`/api/users/${id}/block`),
    onSuccess: (r) => {
      toast(r.blocked ? "Blocked." : "Unblocked.");
      qc.invalidateQueries({ queryKey: qk.profile(username) });
    },
  });

  if (q.isPending) {
    return (
      <div className="card p-6">
        <div className="flex gap-4"><Skeleton className="size-20 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-full" /></div></div>
      </div>
    );
  }
  if (q.isError || !q.data) {
    const err = q.error as { code?: string; message?: string } | null;
    return <EmptyState icon={<Ghost />} title={err?.code === "BLOCKED_BY" ? "This person isn't available" : "No one by that name"} body={err?.code === "BLOCKED_BY" ? undefined : "They may have changed their username, or left."} action={<Button asChild variant="outline"><Link href="/explore">Explore</Link></Button>} />;
  }
  const p = q.data;
  const active = now - new Date(p.lastActiveAt).getTime() < 15 * 60_000;

  return (
    <div className="space-y-4">
      <div className="card relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ember-soft to-transparent" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <Avatar user={p} size="2xl" ring />
            {active && <span className="absolute bottom-1 right-1 size-4 rounded-full bg-sage ring-2 ring-bg-elevated" title="Active recently" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[28px] leading-tight text-fg">{p.displayName || p.username}</h1>
              {p.plan === "PLUS" && <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-[11.5px] font-semibold text-gold"><Crown className="size-3" /> plus</span>}
              {(p.role === "MOD" || p.role === "ADMIN") && <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-0.5 text-[11.5px] font-semibold text-sage"><ShieldCheck className="size-3" /> {p.role.toLowerCase()}</span>}
            </div>
            <p className="text-[14px] text-fg-subtle">@{p.username}{p.pronouns ? ` · ${p.pronouns}` : ""}{p.followsYou ? " · follows you" : ""}</p>
            {p.bio && <p className="mt-2.5 text-[15px] leading-relaxed text-fg text-pretty">{p.bio}</p>}
            {p.struggles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.struggles.map((s) => (
                  <Link key={s} href={`/explore/tag/${s}`} className={cn("rounded-full border px-2.5 py-0.5 text-[12px] font-medium", p.sharedStruggles.includes(s) ? "border-ember/40 bg-ember-soft text-ember" : "border-border bg-surface text-fg-muted")}>{TAG_LABELS[s as Tag] ?? s}{p.sharedStruggles.includes(s) ? " · you too" : ""}</Link>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-fg-muted">
              <span><strong className="text-fg">{p._count.posts}</strong> posts</span>
              <span><strong className="text-fg">{p._count.followers}</strong> followers</span>
              <span><strong className="text-fg">{p._count.following}</strong> following</span>
              <span className="inline-flex items-center gap-1 text-fg-subtle"><Calendar className="size-3.5" /> joined {longDate(p.createdAt)}</span>
            </div>
            {p.moodRing && (p.isOwn || p.showMoodOnProfile) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-fg-subtle"><MoodRing entries={p.moodRing} /><span className="whitespace-nowrap">last 7 days{p.isOwn && !p.showMoodOnProfile ? " · only you can see this" : ""}</span></div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {p.isOwn ? (
              <Button asChild variant="outline" size="sm"><Link href="/settings"><Settings /> Edit profile</Link></Button>
            ) : (
              <>
                <FollowButton userId={p.id} initial={p.isFollowing} onChange={() => qc.invalidateQueries({ queryKey: qk.profile(username) })} />
                {p.canMessage && <MessageButton user={p} />}
                <Menu>
                  <MenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="More"><Ellipsis /></Button></MenuTrigger>
                  <MenuContent>
                    <MenuItem onSelect={() => gate("report", () => setReport(true))}><Flag /> Report</MenuItem>
                    <MenuItem danger onSelect={() => gate("block", () => block.mutate(p.id))}><Ban /> {p.isBlocked ? "Unblock" : "Block"}</MenuItem>
                  </MenuContent>
                </Menu>
              </>
            )}
          </div>
        </div>
        {!p.isOwn && !active && <p className="relative mt-3 text-[12px] text-fg-subtle">last around {timeAgo(p.lastActiveAt)} ago</p>}
      </div>

      {p.isOwn && me && (
        <Segmented value={tab} onChange={setTab} options={[{ value: "posts", label: "Posts" }, { value: "anonymous", label: <span className="inline-flex items-center gap-1"><Ghost className="size-3.5" /> Anonymous</span> }]} />
      )}

      {tab === "posts" ? (
        <Feed queryKey={qk.userPosts(username)} path={`/api/users/${username}/posts`} emptyIcon={<Ghost />} emptyTitle={p.isOwn ? "You haven't posted as yourself yet" : "Nothing posted publicly"} emptyBody={p.isOwn ? "Anonymous posts live in the other tab — only you can see that list." : "Some people only post anonymously. That's the point."} />
      ) : (
        <Feed queryKey={qk.anonPosts} path="/api/users/me/anonymous-posts" emptyIcon={<Ghost />} emptyTitle="No anonymous posts" emptyBody="When you post anonymously, it shows up here for your eyes only." />
      )}
      <ReportDialog open={report} onOpenChange={setReport} target={{ userId: p.id }} />
    </div>
  );
}
