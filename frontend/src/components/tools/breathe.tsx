"use client";

import * as React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const PATTERNS = [
  { id: "calm", name: "Calm", desc: "4 in · 6 out — for the everyday tight chest", phases: [["Breathe in", 4], ["Breathe out", 6]] as [string, number][] },
  { id: "478", name: "4·7·8", desc: "Slows a racing heart, good before sleep", phases: [["Breathe in", 4], ["Hold", 7], ["Breathe out", 8]] as [string, number][] },
  { id: "box", name: "Box", desc: "4·4·4·4 — steadying, used by people under pressure", phases: [["Breathe in", 4], ["Hold", 4], ["Breathe out", 4], ["Hold", 4]] as [string, number][] },
];

export function BreatheWidget({ className }: { className?: string }) {
  const [patternId, setPatternId] = React.useState("calm");
  const pattern = PATTERNS.find((p) => p.id === patternId)!;
  return (
    <div className={cn("card relative overflow-hidden p-6 sm:p-8", className)}>
      <div className="aurora"><span /><span /><span /></div>
      <div className="relative">
        <div className="flex flex-wrap gap-1.5">
          {PATTERNS.map((p) => (
            <button key={p.id} onClick={() => setPatternId(p.id)} className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors", patternId === p.id ? "border-ember bg-ember-soft text-ember" : "border-border bg-bg-elevated/70 text-fg-muted hover:text-fg")}>{p.name}</button>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-fg-muted">{pattern.desc}</p>
        <BreatheSession key={pattern.id} phases={pattern.phases} />
      </div>
    </div>
  );
}

function BreatheSession({ phases }: { phases: [string, number][] }) {
  const [running, setRunning] = React.useState(false);
  const [s, setS] = React.useState({ phase: 0, remaining: phases[0]![1], cycles: 0 });

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setS((cur) => {
        if (cur.remaining > 1) return { ...cur, remaining: cur.remaining - 1 };
        const next = (cur.phase + 1) % phases.length;
        return { phase: next, remaining: phases[next]![1], cycles: next === 0 ? cur.cycles + 1 : cur.cycles };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phases]);

  const [label, seconds] = phases[s.phase]!;
  const inhaling = label === "Breathe in";
  const holding = label === "Hold";
  const afterInhale = s.phase > 0 && phases[s.phase - 1]![0] === "Breathe in";
  const scale = !running ? 0.72 : inhaling ? 1 : holding ? (afterInhale ? 1 : 0.72) : 0.72;

  return (
    <>
      <div className="my-10 flex items-center justify-center">
        <div className="relative flex size-64 items-center justify-center sm:size-72">
          <div className="absolute inset-0 rounded-full border border-border-strong/60" />
          <div className="absolute inset-[18%] rounded-full border border-dashed border-border-strong/40" />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              transform: `scale(${scale})`,
              transition: `transform ${running ? seconds : 1.2}s cubic-bezier(.45,.05,.55,.95)`,
              background: "radial-gradient(circle at 50% 45%, var(--gold) 0%, var(--ember) 45%, var(--violet) 100%)",
              boxShadow: "0 0 80px -10px var(--ember)",
              opacity: 0.9,
            }}
          />
          <div className="relative text-center text-ember-fg">
            <p className="font-display text-[22px] leading-none drop-shadow sm:text-[26px]" key={label}>{running ? label : "Ready when you are"}</p>
            {running && <p className="mt-2 text-[40px] font-semibold leading-none tabular-nums drop-shadow">{s.remaining}</p>}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button size="lg" onClick={() => setRunning((r) => !r)}>{running ? <><Pause /> Pause</> : <><Play /> {s.cycles || s.phase ? "Resume" : "Begin"}</>}</Button>
        <Button size="lg" variant="ghost" onClick={() => { setRunning(false); setS({ phase: 0, remaining: phases[0]![1], cycles: 0 }); }}><RotateCcw /> Reset</Button>
      </div>
      <p className="mt-4 text-center text-[13px] text-fg-subtle">{s.cycles} round{s.cycles === 1 ? "" : "s"} · nobody is counting but you</p>
    </>
  );
}
