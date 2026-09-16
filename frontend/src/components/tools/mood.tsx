"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flame, Table2, LineChart } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { FEELINGS, MOOD_SCALE } from "@/lib/constants";
import type { MoodEntry, MoodSummary } from "@/lib/types";
import { cn, todayKey } from "@/lib/utils";
import { useNow } from "@/hooks/use-now";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Tip } from "@/components/ui/popover";

export function MoodCheckIn({ className }: { className?: string }) {
  const summary = useQuery({ queryKey: qk.moodSummary, queryFn: () => api.get<MoodSummary>("/api/mood/summary") });
  if (summary.isPending) return <div className={cn("card p-5", className)}><div className="skeleton h-40 w-full" /></div>;
  const today = summary.data?.today ?? null;
  return <MoodForm key={today ? `${today.dayKey}-${today.score}-${today.feelings.join(",")}` : "new"} today={today} streak={summary.data?.streak ?? 0} className={className} />;
}

function MoodForm({ today, streak, className }: { today: MoodEntry | null; streak: number; className?: string }) {
  const qc = useQueryClient();
  const [score, setScore] = React.useState<number | null>(today?.score ?? null);
  const [feelings, setFeelings] = React.useState<string[]>(today?.feelings ?? []);
  const [note, setNote] = React.useState(today?.note ?? "");
  const m = useMutation({
    mutationFn: () => api.put<MoodEntry>("/api/mood/today", { dayKey: todayKey(), score, feelings, note: note.trim() || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.moodSummary });
      qc.invalidateQueries({ queryKey: ["mood-history"] });
      toast(today ? "Updated today's check-in." : "Logged. Thank you for noticing yourself.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className={cn("card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[20px] text-fg">{today ? "Today, so far" : "How is today, honestly?"}</p>
          <p className="text-[13px] text-fg-muted">Private. Only you see this — unless you choose to show a 7-day ring on your profile.</p>
        </div>
        {streak ? (
          <Tip label="Consecutive days checked in"><span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-[12.5px] font-semibold text-gold"><Flame className="size-3.5" /> {streak}</span></Tip>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {MOOD_SCALE.map((s) => (
          <button key={s.score} type="button" onClick={() => setScore(s.score)} className={cn("flex flex-col items-center gap-1.5 rounded-2xl border py-3 transition-all", score === s.score ? "scale-[1.03] border-ember bg-ember-soft" : "border-border hover:bg-surface")} aria-pressed={score === s.score}>
            <span className="text-[26px] leading-none">{s.emoji}</span>
            <span className={cn("text-[12px]", score === s.score ? "font-semibold text-ember" : "text-fg-muted")}>{s.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {FEELINGS.map((f) => (
          <button key={f} type="button" onClick={() => setFeelings((p) => (p.includes(f) ? p.filter((x) => x !== f) : p.length < 5 ? [...p, f] : p))} className={cn("h-8 rounded-full border px-3 text-[12.5px] font-medium transition-colors", feelings.includes(f) ? "border-violet/40 bg-violet-soft text-violet" : "border-border text-fg-muted hover:bg-surface")}>
            {f}
          </button>
        ))}
      </div>
      <Textarea className="mt-3" rows={2} value={note} onChange={(e) => setNote(e.target.value.slice(0, 280))} placeholder="One line about today, if you want. (optional)" />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[12px] text-fg-subtle">{note.length}/280</span>
        <Button onClick={() => m.mutate()} disabled={!score} loading={m.isPending}>{today ? "Update" : "Save check-in"}</Button>
      </div>
    </div>
  );
}

/** Single-series line over time. One hue, thin line, ≥8px markers, hover tooltip, table view. */
export function MoodChart({ entries, days = 30, className }: { entries: MoodEntry[]; days?: number; className?: string }) {
  const [view, setView] = React.useState<"chart" | "table">("chart");
  const [hover, setHover] = React.useState<number | null>(null);
  const now = useNow();
  const W = 640, H = 200, PAD = { l: 34, r: 14, t: 14, b: 28 };
  const byDay = new Map(entries.map((e) => [e.dayKey, e]));
  const points = Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const key = todayKey(d);
    return { key, i, entry: byDay.get(key) ?? null, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) };
  });
  const x = (i: number) => PAD.l + (i / (days - 1)) * (W - PAD.l - PAD.r);
  const y = (s: number) => PAD.t + (1 - (s - 1) / 4) * (H - PAD.t - PAD.b);
  const filled = points.filter((p) => p.entry);
  const path = filled.map((p, idx) => `${idx === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.entry!.score).toFixed(1)}`).join(" ");
  const area = filled.length > 1 ? `${path} L${x(filled.at(-1)!.i).toFixed(1)},${(H - PAD.b).toFixed(1)} L${x(filled[0]!.i).toFixed(1)},${(H - PAD.b).toFixed(1)} Z` : "";
  const hovered = hover !== null ? points[hover] : null;

  return (
    <div className={cn("card p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between">
        <p className="font-display text-[18px] text-fg">Last {days} days</p>
        <div className="inline-flex rounded-full bg-surface p-0.5">
          <button onClick={() => setView("chart")} className={cn("rounded-full p-1.5", view === "chart" ? "bg-bg-elevated shadow-soft" : "text-fg-subtle")} aria-label="Chart view"><LineChart className="size-4" /></button>
          <button onClick={() => setView("table")} className={cn("rounded-full p-1.5", view === "table" ? "bg-bg-elevated shadow-soft" : "text-fg-subtle")} aria-label="Table view"><Table2 className="size-4" /></button>
        </div>
      </div>
      {filled.length === 0 ? (
        <p className="py-10 text-center text-sm text-fg-muted">No check-ins yet in this window. Today&apos;s a fine day to start.</p>
      ) : view === "table" ? (
        <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-border">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-surface text-left text-[11.5px] uppercase tracking-wider text-fg-subtle"><tr><th className="px-3 py-2">Day</th><th className="px-3 py-2">Mood</th><th className="px-3 py-2">Feelings</th><th className="px-3 py-2">Note</th></tr></thead>
            <tbody>
              {[...filled].reverse().map((p) => (
                <tr key={p.key} className="border-t border-border"><td className="px-3 py-2 text-fg-muted">{p.label}</td><td className="px-3 py-2 text-fg">{MOOD_SCALE[p.entry!.score - 1]?.emoji} {MOOD_SCALE[p.entry!.score - 1]?.label}</td><td className="px-3 py-2 text-fg-muted">{p.entry!.feelings.join(", ") || "—"}</td><td className="px-3 py-2 text-fg-muted">{p.entry!.note ?? "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-2" onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Mood over the last ${days} days`}>
            {[1, 2, 3, 4, 5].map((s) => (
              <g key={s}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(s)} y2={y(s)} stroke="var(--border)" strokeWidth={1} />
                <text x={PAD.l - 8} y={y(s) + 4} textAnchor="end" fontSize={11} fill="var(--fg-subtle)">{MOOD_SCALE[s - 1]?.emoji}</text>
              </g>
            ))}
            {[0, Math.floor(days / 2), days - 1].map((i) => (
              <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === days - 1 ? "end" : "middle"} fontSize={11} fill="var(--fg-subtle)">{points[i]!.label}</text>
            ))}
            {area && <path d={area} fill="var(--ember)" opacity={0.12} />}
            <path d={path} fill="none" stroke="var(--ember)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {filled.map((p) => (
              <circle key={p.key} cx={x(p.i)} cy={y(p.entry!.score)} r={hover === p.i ? 6 : 4} fill="var(--ember)" stroke="var(--bg-elevated)" strokeWidth={2} />
            ))}
            {points.map((p) => (
              <rect key={p.key} x={x(p.i) - (W - PAD.l - PAD.r) / days / 2} y={PAD.t} width={(W - PAD.l - PAD.r) / days} height={H - PAD.t - PAD.b} fill="transparent" onMouseEnter={() => p.entry && setHover(p.i)} />
            ))}
            {hovered?.entry && <line x1={x(hovered.i)} x2={x(hovered.i)} y1={PAD.t} y2={H - PAD.b} stroke="var(--fg-subtle)" strokeDasharray="3 3" />}
          </svg>
          {hovered?.entry && (
            <div className="pointer-events-none absolute -top-1 rounded-xl border border-border-strong bg-bg-elevated px-3 py-2 text-[12.5px] shadow-pop" style={{ left: `clamp(0px, calc(${(x(hovered.i) / W) * 100}% - 70px), calc(100% - 150px))` }}>
              <p className="font-semibold text-fg">{hovered.label} · {MOOD_SCALE[hovered.entry.score - 1]?.emoji} {MOOD_SCALE[hovered.entry.score - 1]?.label}</p>
              {hovered.entry.feelings.length > 0 && <p className="text-fg-muted">{hovered.entry.feelings.join(", ")}</p>}
              {hovered.entry.note && <p className="mt-0.5 max-w-[220px] text-fg-muted">“{hovered.entry.note}”</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Seven small dots — the only mood detail a profile can opt into showing. */
export function MoodRing({ entries, className }: { entries: { dayKey: string; score: number }[]; className?: string }) {
  const now = useNow();
  const byDay = new Map(entries.map((e) => [e.dayKey, e.score]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return { key: todayKey(d), label: d.toLocaleDateString("en-IN", { weekday: "short" }), score: byDay.get(todayKey(d)) ?? null };
  });
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)} aria-label="Mood over the last 7 days">
      {days.map((d) => (
        <Tip key={d.key} label={`${d.label}: ${d.score ? MOOD_SCALE[d.score - 1]?.label : "no check-in"}`}>
          <span className="size-3 rounded-full border border-border" style={{ background: d.score ? MOOD_SCALE[d.score - 1]?.color : "transparent", opacity: d.score ? 1 : 0.5 }} />
        </Tip>
      ))}
    </div>
  );
}

export function MoodStats({ summary }: { summary: MoodSummary }) {
  const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(1));
  const items = [
    { label: "7-day avg", value: fmt(summary.avg7), sub: "out of 5" },
    { label: "30-day avg", value: fmt(summary.avg30), sub: "out of 5" },
    { label: "Streak", value: String(summary.streak), sub: "days in a row" },
    { label: "Total", value: String(summary.total), sub: "check-ins" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="card-flat px-4 py-3">
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-fg-subtle">{it.label}</p>
          <p className="mt-1 font-display text-[26px] leading-none text-fg">{it.value}</p>
          <p className="mt-1 text-[12px] text-fg-subtle">{it.sub}</p>
        </div>
      ))}
      {summary.topFeelings.length > 0 && (
        <p className="col-span-2 text-[13px] text-fg-muted sm:col-span-4">Showing up most this month: <span className="text-fg">{summary.topFeelings.join(", ")}</span>. <Link href="/tools/reflection" className="text-ember hover:underline">Ask Ember what it notices →</Link></p>
      )}
    </div>
  );
}
