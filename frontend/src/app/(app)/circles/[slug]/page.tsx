"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Users, ShieldCheck, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { TAG_LABELS, type Tag } from "@/lib/constants";
import type { Circle, Person } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/use-me";
import { Feed } from "@/components/feed/feed";
import { PostComposer } from "@/components/post/post-composer";
import { JoinButton } from "@/components/circles/circle-card";
import { Avatar } from "@/components/ui/avatar";
import { Spinner, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CircleBadge } from "@/components/icons/circle-icon";

export default function CirclePage() {
  const { slug } = useParams<{ slug: string }>();
  const { me } = useMe();
  const [showMembers, setShowMembers] = React.useState(false);
  const circle = useQuery({ queryKey: qk.circle(slug), queryFn: () => api.get<Circle>(`/api/circles/${slug}`) });
  const members = useQuery({ queryKey: qk.circleMembers(slug), queryFn: () => api.page<Person & { role: string }>(`/api/circles/${slug}/members?limit=30`), enabled: showMembers });

  if (circle.isPending) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (circle.isError || !circle.data) return <EmptyState title="Circle not found" action={<Button asChild variant="outline"><Link href="/circles">All circles</Link></Button>} />;
  const c = circle.data;

  return (
    <div className="space-y-4">
      <div className="card relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full blur-3xl" style={{ background: `oklch(0.7 0.14 ${c.hue} / 0.45)` }} />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
          <CircleBadge icon={c.icon} hue={c.hue} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[28px] leading-tight text-fg">{c.name}</h1>
              {c.isOfficial && <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-0.5 text-[11.5px] font-semibold text-sage"><ShieldCheck className="size-3" /> official</span>}
            </div>
            <p className="mt-1 text-[15px] text-fg-muted">{c.tagline}</p>
            {c.description && <p className="mt-3 text-[14.5px] leading-relaxed text-fg text-pretty">{c.description}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">{c.tags.map((t) => <Link key={t} href={`/explore/tag/${t}`} className="rounded-full bg-surface px-2.5 py-0.5 text-[12px] font-medium text-fg-muted hover:text-ember">#{TAG_LABELS[t as Tag] ?? t}</Link>)}</div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <JoinButton circle={c} size="md" />
              <button onClick={() => setShowMembers((v) => !v)} className="inline-flex items-center gap-1.5 text-[13.5px] text-fg-muted hover:text-fg"><Users className="size-4" /> {c.memberCount} members <ChevronDown className={cn("size-3.5 transition-transform", showMembers && "rotate-180")} /></button>
              <span className="text-[13.5px] text-fg-subtle">{c.postCount} posts</span>
            </div>
          </div>
        </div>
        {c.guidelines && (
          <div className="relative mt-4 rounded-2xl bg-surface/70 p-4 text-[13.5px] text-fg-muted">
            <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wider text-fg-subtle">House rules</p>
            {c.guidelines}
          </div>
        )}
        {showMembers && (
          <div className="relative mt-4 flex flex-wrap gap-2">
            {members.isPending ? <Spinner /> : members.data!.data.map((m) => (
              <Link key={m.id ?? m.username} href={`/u/${m.username}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated py-1 pl-1 pr-3 text-[13px] text-fg hover:border-ember/40">
                <Avatar user={{ username: m.username, displayName: m.displayName, avatarUrl: m.avatarUrl }} size="xs" /> {m.displayName || m.username}{m.role !== "MEMBER" && <span className="text-[11px] text-fg-subtle">{m.role.toLowerCase()}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>

      {me && c.isMember ? (
        <PostComposer circle={{ id: c.id, name: c.name, icon: c.icon }} />
      ) : me ? (
        <p className="rounded-2xl border border-dashed border-border-strong px-4 py-3 text-center text-[13.5px] text-fg-muted">Join the circle to post in it. Reading is always open.</p>
      ) : null}

      <Feed queryKey={qk.circlePosts(slug)} path={`/api/circles/${slug}/posts`} emptyTitle="Nothing posted here yet" emptyBody="Every circle starts with one person going first." />
    </div>
  );
}
