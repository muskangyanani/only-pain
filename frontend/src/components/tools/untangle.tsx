"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Trash2, ChevronDown } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { LIMITS } from "@/lib/constants";
import type { Reframe } from "@/lib/types";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/misc";

export function ReframeCard({ r, onDelete }: { r: Reframe; onDelete?: () => void }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-surface/60 px-5 py-4">
        <p className="text-[11.5px] font-semibold uppercase tracking-wider text-fg-subtle">The thought</p>
        <p className="mt-1 font-display text-[19px] italic leading-snug text-fg">“{r.thought}”</p>
      </div>
      <div className="space-y-5 px-5 py-5">
        <section>
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-sage">Of course it feels this way</p>
          <p className="mt-1 text-[15px] leading-relaxed text-fg">{r.validation}</p>
        </section>
        <section>
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-violet">Patterns your brain might be running</p>
          <ul className="mt-2 space-y-2">
            {r.patterns.map((p, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-surface px-3.5 py-2.5"><Badge tone="violet" className="h-fit shrink-0">{p.name}</Badge><span className="text-[14px] text-fg-muted">{p.how}</span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-ember/30 bg-ember-soft/50 p-4">
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ember">A kinder, truer version</p>
          <p className="mt-1 font-display text-[18px] leading-snug text-fg">{r.reframe}</p>
        </section>
        <section>
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-gold">One tiny step</p>
          <p className="mt-1 text-[15px] text-fg">{r.tinyStep}</p>
        </section>
        <div className="flex items-center justify-between pt-1 text-[12px] text-fg-subtle">
          <span>{timeAgo(r.createdAt)} · private to you</span>
          {onDelete && <button onClick={onDelete} className="inline-flex items-center gap-1 hover:text-rose"><Trash2 className="size-3.5" /> delete</button>}
        </div>
      </div>
    </div>
  );
}

export function Untangle() {
  const qc = useQueryClient();
  const router = useRouter();
  const [thought, setThought] = React.useState("");
  const [result, setResult] = React.useState<Reframe | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);
  const history = useQuery({ queryKey: qk.reframes, queryFn: () => api.get<Reframe[]>("/api/tools/reframe") });
  const m = useMutation({
    mutationFn: () => api.post<Reframe>("/api/tools/reframe", { thought: thought.trim() }),
    onSuccess: (r) => {
      setResult(r);
      setThought("");
      qc.invalidateQueries({ queryKey: qk.reframes });
    },
    onError: (e: ApiError) => (e.isQuota ? toast(e.message, { duration: 8000, action: e.extra.upgradeAvailable ? { label: "See Plus", onClick: () => router.push("/plus") } : undefined }) : toast.error(e.message)),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/tools/reframe/${id}`),
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: qk.reframes });
      if (result?.id === id) setResult(null);
    },
  });

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <p className="font-display text-[20px] text-fg">Write the thought exactly as it sounds in your head.</p>
        <p className="mt-1 text-[13.5px] text-fg-muted">Ember will take it seriously, name the patterns it&apos;s running, and hand back a version that&apos;s kinder <em>and</em> more accurate. Inspired by CBT; not therapy.</p>
        <Textarea autoGrow className="mt-4 text-[16px]" rows={3} value={thought} onChange={(e) => setThought(e.target.value.slice(0, LIMITS.thought))} placeholder="e.g. Everyone at work has figured out I'm useless and they're just being polite." />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] text-fg-subtle">{thought.length}/{LIMITS.thought}</span>
          <Button onClick={() => m.mutate()} disabled={thought.trim().length < 3} loading={m.isPending}><Sparkles /> Untangle it</Button>
        </div>
      </div>
      {m.isPending && (
        <div className="card animate-pulse-soft p-5 text-center text-sm text-fg-muted">Ember is reading it slowly…</div>
      )}
      {result && <div className="animate-fade-up"><ReframeCard r={result} onDelete={() => del.mutate(result.id)} /></div>}
      {(history.data?.length ?? 0) > 0 && (
        <div>
          <button onClick={() => setShowHistory((v) => !v)} className="flex w-full items-center justify-between rounded-2xl px-1 py-2 text-left text-[13px] font-semibold uppercase tracking-wider text-fg-subtle hover:text-fg">
            Earlier untanglings ({history.data!.length}) <ChevronDown className={cn("size-4 transition-transform", showHistory && "rotate-180")} />
          </button>
          {showHistory && (
            <div className="mt-2 space-y-4">
              {history.data!.filter((r) => r.id !== result?.id).map((r) => <ReframeCard key={r.id} r={r} onDelete={() => del.mutate(r.id)} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
