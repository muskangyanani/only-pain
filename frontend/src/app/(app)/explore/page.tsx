"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { TAG_LABELS, type Tag } from "@/lib/constants";
import type { Circle, Person, Post } from "@/lib/types";
import { useMe } from "@/hooks/use-me";
import { useInfinitePage, useLoadMore } from "@/hooks/use-infinite-page";
import { Input } from "@/components/ui/input";
import { EmptyState, SectionTitle, Segmented, Spinner } from "@/components/ui/misc";
import { PostCard } from "@/components/post/post-card";
import { PersonRow } from "@/components/people/person-card";
import { CircleCard } from "@/components/circles/circle-card";
import { PageHeader } from "@/components/layout/page-header";

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function ExplorePage() {
  const { me } = useMe();
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<"posts" | "users">("posts");
  const dq = useDebounced(q.trim());
  const active = dq.length >= 2;

  const posts = useInfinitePage<Post>(qk.search(dq, "posts"), "/api/explore/search", { params: { q: dq, type: "posts" }, enabled: active && type === "posts" });
  const users = useInfinitePage<Person>(qk.search(dq, "users"), "/api/explore/search", { params: { q: dq, type: "users" }, enabled: active && type === "users" });
  const postsSentinel = useLoadMore(posts);
  const usersSentinel = useLoadMore(users);
  const people = useQuery({ queryKey: qk.people, queryFn: () => api.get<Person[]>("/api/explore/people"), enabled: !!me });
  const circles = useQuery({ queryKey: qk.suggestedCircles, queryFn: () => api.get<Circle[]>("/api/explore/circles/suggested") });
  const tags = useQuery({ queryKey: qk.tags, queryFn: () => api.get<{ tag: string; count: number }[]>("/api/explore/tags") });

  return (
    <div className="space-y-6">
      <PageHeader title="Explore" subtitle="People carrying similar things, and the rooms they gather in." sticky={false} />
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-fg-subtle" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts or people…" className="h-12 rounded-full pl-11 pr-4 text-[15px]" />
      </div>

      {active ? (
        <div className="space-y-4">
          <Segmented value={type} onChange={setType} options={[{ value: "posts", label: "Posts" }, { value: "users", label: "People" }]} />
          {type === "posts" ? (
            posts.isPending ? <div className="flex justify-center py-8"><Spinner /></div> : posts.items.length === 0 ? <EmptyState title="Nothing matched" body="Try a different word — or post about it yourself." /> : (
              <div className="space-y-3">{posts.items.map((p) => <PostCard key={p.id} post={p} />)}<div ref={postsSentinel} /></div>
            )
          ) : users.isPending ? <div className="flex justify-center py-8"><Spinner /></div> : users.items.length === 0 ? <EmptyState title="No one by that name" /> : (
            <div className="space-y-2">{users.items.map((u) => <PersonRow key={u.id ?? u.username} person={u} showMessage />)}<div ref={usersSentinel} /></div>
          )}
        </div>
      ) : (
        <>
          {me && (
            <section>
              <SectionTitle>People who get it</SectionTitle>
              {people.isPending ? <div className="flex justify-center py-6"><Spinner /></div> : people.data!.length === 0 ? (
                <EmptyState icon={<Users />} title="Tell us what you're carrying first" body="Matching is based on the struggles you pick in onboarding or settings." action={<Link href={me.onboardedAt ? "/settings" : "/onboarding"} className="text-sm font-medium text-ember hover:underline">Set it up →</Link>} className="py-8" />
              ) : (
                <div className="grid gap-2">{people.data!.map((p) => <PersonRow key={p.id ?? p.username} person={p} showMessage />)}</div>
              )}
            </section>
          )}
          {(circles.data?.length ?? 0) > 0 && (
            <section>
              <SectionTitle action={<Link href="/circles" className="text-[12px] font-medium text-ember hover:underline">all circles</Link>}>Circles for you</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">{circles.data!.slice(0, 4).map((c) => <CircleCard key={c.id} circle={c} />)}</div>
            </section>
          )}
          <section>
            <SectionTitle>Browse by what hurts</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {(tags.data ?? []).map((t) => (
                <Link key={t.tag} href={`/explore/tag/${t.tag}`} className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-bg-elevated px-3.5 text-[13.5px] font-medium text-fg-muted transition-colors hover:border-ember/40 hover:text-ember">
                  #{TAG_LABELS[t.tag as Tag] ?? t.tag} <span className="text-[12px] text-fg-subtle">{t.count}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
