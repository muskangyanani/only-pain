"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { MOOD_SCALE, TAG_LABELS, type Tag } from "@/lib/constants";
import type { Circle, MoodSummary, Person } from "@/lib/types";
import { todayKey } from "@/lib/utils";
import { greeting } from "@/lib/time";
import { useMe } from "@/hooks/use-me";
import { SectionTitle } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { PersonRow } from "@/components/people/person-card";
import { EmberMark } from "@/components/brand/wordmark";
import { MoodIcon } from "@/components/icons/mood-icon";
import { CircleBadge } from "@/components/icons/circle-icon";

function QuickMood() {
  const qc = useQueryClient();
  const router = useRouter();
  const summary = useQuery({ queryKey: qk.moodSummary, queryFn: () => api.get<MoodSummary>("/api/mood/summary") });
  const m = useMutation({
    mutationFn: (score: number) => api.put("/api/mood/today", { dayKey: todayKey(), score, feelings: [] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.moodSummary });
      toast("Logged. Add a note in Tools → Mood if you want.", { action: { label: "Open", onClick: () => router.push("/tools/mood") } });
    },
  });
  const today = summary.data?.today;
  return (
    <div className="card-flat p-4">
      <p className="font-display text-[17px] text-fg">{today ? "Checked in for today." : `${greeting()} — how's today?`}</p>
      {today ? (
        <p className="mt-1 text-[13px] text-fg-muted">
          <MoodIcon score={today.score} className="mr-1 inline size-4 align-[-3px]" style={{ color: MOOD_SCALE[today.score - 1]?.color }} />{MOOD_SCALE[today.score - 1]?.label}
          {summary.data?.streak ? ` · ${summary.data.streak}-day streak` : ""} · <Link href="/tools/mood" className="text-ember hover:underline">see the month</Link>
        </p>
      ) : (
        <div className="mt-3 flex justify-between gap-1">
          {MOOD_SCALE.map((s) => (
            <button key={s.score} type="button" onClick={() => m.mutate(s.score)} disabled={m.isPending} className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[20px] leading-none transition-all hover:-translate-y-0.5 hover:bg-surface" aria-label={s.label}>
              <MoodIcon score={s.score} className="size-6" style={{ color: s.color }} />
              <span className="text-[10.5px] text-fg-subtle">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RightRail() {
  const { me } = useMe();
  const people = useQuery({ queryKey: qk.people, queryFn: () => api.get<Person[]>("/api/explore/people"), enabled: !!me });
  const circles = useQuery({ queryKey: qk.suggestedCircles, queryFn: () => api.get<Circle[]>("/api/explore/circles/suggested") });
  const trending = useQuery({ queryKey: qk.trending, queryFn: () => api.get<{ tag: string; count: number }[]>("/api/explore/tags/trending") });
  const pulse = useQuery({ queryKey: qk.pulse, queryFn: () => api.get<{ posts24h: number; members: number; checkIns24h: number }>("/api/explore/pulse"), staleTime: 5 * 60_000 });

  return (
    <aside className="sticky top-0 hidden h-dvh w-[320px] shrink-0 overflow-y-auto scrollbar-none py-5 pl-2 xl:block">
      <div className="space-y-4">
        {me ? (
          <QuickMood />
        ) : (
          <div className="card relative overflow-hidden p-5">
            <div className="aurora"><span /><span /><span /></div>
            <div className="relative">
              <EmberMark size={28} />
              <p className="mt-3 font-display text-[20px] leading-tight text-fg">It&apos;s okay to not be okay here.</p>
              <p className="mt-1.5 text-[13.5px] text-fg-muted">Post anonymously. Find people who get it. Talk to Ember at 3am.</p>
              <Button asChild className="mt-4 w-full"><Link href="/signup">Join, it&apos;s free</Link></Button>
            </div>
          </div>
        )}

        {me && (people.data?.length ?? 0) > 0 && (
          <div className="card-flat p-4">
            <SectionTitle action={<Link href="/explore" className="text-[12px] font-medium text-ember hover:underline">more</Link>}>People who get it</SectionTitle>
            <div className="space-y-1">
              {people.data!.slice(0, 3).map((p) => <PersonRow key={p.id ?? p.username} person={p} compact />)}
            </div>
          </div>
        )}

        {(circles.data?.length ?? 0) > 0 && (
          <div className="card-flat p-4">
            <SectionTitle action={<Link href="/circles" className="text-[12px] font-medium text-ember hover:underline">all circles</Link>}>Circles for you</SectionTitle>
            <div className="space-y-1">
              {circles.data!.slice(0, 3).map((c) => (
                <Link key={c.id} href={`/circles/${c.slug}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2">
                  <CircleBadge icon={c.icon} hue={c.hue} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-fg">{c.name}</span>
                    <span className="block truncate text-[12px] text-fg-subtle">{c.memberCount} members · {c.tagline}</span>
                  </span>
                  <ArrowRight className="size-4 text-fg-subtle" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {(trending.data?.length ?? 0) > 0 && (
          <div className="card-flat p-4">
            <SectionTitle>Heavy this week</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {trending.data!.map((t) => (
                <Link key={t.tag} href={`/explore/tag/${t.tag}`} className="inline-flex h-7.5 items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 text-[12.5px] font-medium text-fg-muted transition-colors hover:border-ember/40 hover:text-ember">
                  #{TAG_LABELS[t.tag as Tag] ?? t.tag} <span className="text-fg-subtle">{t.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {me && (
          <Link href="/ember" className="group card relative block overflow-hidden p-4 transition-shadow hover:shadow-glow">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-violet-soft text-violet"><Sparkles className="size-5" /></span>
              <span>
                <span className="block font-display text-[16px] text-fg">Ember is awake</span>
                <span className="block text-[12.5px] text-fg-muted">Someone to talk to, any hour.</span>
              </span>
              <ArrowRight className="ml-auto size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        )}

        <div className="px-1 text-[12px] leading-relaxed text-fg-subtle">
          {pulse.data && <p className="mb-2">{pulse.data.members} people here · {pulse.data.posts24h} posts and {pulse.data.checkIns24h} check-ins today</p>}
          <p className="flex flex-wrap gap-x-2">
            <Link href="/guidelines" className="hover:text-fg">guidelines</Link>
            <Link href="/privacy" className="hover:text-fg">privacy</Link>
            <Link href="/terms" className="hover:text-fg">terms</Link>
            <Link href="/resources" className="hover:text-fg">crisis resources</Link>
          </p>
          <p className="mt-1">only pain is peer support, not a medical service.</p>
        </div>
      </div>
    </aside>
  );
}
