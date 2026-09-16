"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crown, RefreshCw, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Reflection } from "@/lib/types";
import { useMe } from "@/hooks/use-me";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { longDate } from "@/lib/time";

export default function ReflectionPage() {
  const { me } = useMe();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.reflection, queryFn: () => api.get<Reflection>("/api/tools/reflection"), enabled: me?.plan === "PLUS", retry: false });
  const regen = useMutation({
    mutationFn: () => api.post<Reflection>("/api/tools/reflection"),
    onSuccess: (r) => qc.setQueryData(qk.reflection, r),
    onError: (e: ApiError) => toast.error(e.message),
  });

  if (me && me.plan !== "PLUS") {
    return (
      <div>
        <PageHeader back="/tools" title="Weekly reflection" />
        <div className="card relative overflow-hidden p-8 text-center">
          <div className="aurora"><span /><span /><span /></div>
          <div className="relative mx-auto max-w-md">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gold-soft text-gold"><Crown className="size-7" /></span>
            <h2 className="mt-4 font-display text-[26px] text-fg">Ember reads your week and writes back.</h2>
            <p className="mt-2 text-[14.5px] text-fg-muted text-pretty">Every week, a short, kind reflection built from your private check-ins and what you wrote: what showed up, what helped, one gentle experiment for next week. It&apos;s part of Plus.</p>
            <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-border bg-bg-elevated/70 p-4 text-left text-[13.5px]">
              <p className="font-display text-[16px] italic text-fg">“A week with real weather in it — you kept showing up.”</p>
              <p className="mt-2 text-fg-muted">• Tired and overwhelmed showed up most, usually together.</p>
              <p className="text-fg-muted">• The day you wrote about the small win was your highest score.</p>
            </div>
            <Button asChild size="lg" className="mt-6"><Link href="/plus"><Crown /> See Plus</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  const r = q.data;
  return (
    <div>
      <PageHeader back="/tools" title="Weekly reflection" subtitle={r ? `${r.weekKey} · written ${longDate(r.createdAt)}` : undefined} actions={r ? <Button size="sm" variant="ghost" onClick={() => regen.mutate()} loading={regen.isPending}><RefreshCw /> Rewrite</Button> : undefined} />
      {q.isPending ? <div className="flex flex-col items-center gap-3 py-16 text-sm text-fg-muted"><Spinner /> Ember is reading your week…</div> : q.isError ? (
        <div className="card p-6 text-center text-sm text-fg-muted">{(q.error as Error).message}<div className="mt-3"><Button variant="outline" onClick={() => q.refetch()}>Try again</Button></div></div>
      ) : r ? (
        <div className="card overflow-hidden">
          <div className="relative border-b border-border bg-surface/60 px-6 py-6">
            <p className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-violet"><Sparkles className="size-3.5" /> what Ember noticed</p>
            <h2 className="mt-2 font-display text-[26px] leading-snug text-fg">{r.content.headline}</h2>
          </div>
          <div className="space-y-5 px-6 py-6">
            <ul className="space-y-2.5">
              {r.content.observations.map((o, i) => <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-fg"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ember" />{o}</li>)}
            </ul>
            <div className="rounded-2xl border border-sage/30 bg-sage-soft/60 p-4">
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-sage">A small experiment for next week</p>
              <p className="mt-1 text-[15px] text-fg">{r.content.gentleSuggestion}</p>
            </div>
            <p className="font-display text-[19px] italic leading-snug text-fg">“{r.content.affirmation}”</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
