"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { STRUGGLES, STRUGGLE_BLURBS } from "@/lib/constants";
import type { Circle, Me } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/use-me";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { CircleBadge } from "@/components/icons/circle-icon";

export default function OnboardingPage() {
  const { me } = useMe();
  if (!me) return null;
  return <OnboardingFlow key={me.id} me={me} />;
}

function OnboardingFlow({ me }: { me: Me }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [displayName, setDisplayName] = React.useState(me.displayName ?? "");
  const [pronouns, setPronouns] = React.useState(me.pronouns ?? "");
  const [struggles, setStruggles] = React.useState<string[]>(me.struggles);
  const done = useMutation({
    mutationFn: () => api.post<Me>("/api/settings/onboarding", { struggles, displayName: displayName || null, pronouns: pronouns || null }),
    onSuccess: (m) => {
      qc.setQueryData(qk.me, m);
      qc.invalidateQueries({ queryKey: ["circles"] });
      setStep(2);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mine = useQuery({ queryKey: qk.circles("", true), queryFn: () => api.get<Circle[]>("/api/circles?mine=1"), enabled: step === 2 });

  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6 flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-ember" : "bg-surface-2")} />)}</div>

      {step === 0 && (
        <div className="animate-fade-up space-y-5">
          <div><h1 className="font-display text-[30px] leading-tight text-fg">What should we call you?</h1><p className="mt-1 text-[14px] text-fg-muted">Not your legal name. Whatever feels like yours. You can skip this.</p></div>
          <Field label="Name" htmlFor="dn"><Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value.slice(0, 40))} placeholder={me.username} autoFocus /></Field>
          <Field label="Pronouns (optional)" htmlFor="pn"><Input id="pn" value={pronouns} onChange={(e) => setPronouns(e.target.value.slice(0, 24))} placeholder="she/her · he/him · they/them" /></Field>
          <div className="flex justify-end"><Button size="lg" onClick={() => setStep(1)}>Next <ArrowRight /></Button></div>
        </div>
      )}

      {step === 1 && (
        <div className="animate-fade-up space-y-5">
          <div><h1 className="font-display text-[30px] leading-tight text-fg">What are you carrying right now?</h1><p className="mt-1 text-[14px] text-fg-muted">Pick up to six. This shapes your feed and finds people who get it. Only you see the list unless you choose to show it.</p></div>
          <div className="grid gap-2 sm:grid-cols-2">
            {STRUGGLES.map((s) => {
              const on = struggles.includes(s);
              return (
                <button key={s} type="button" onClick={() => setStruggles((p) => (on ? p.filter((x) => x !== s) : p.length < 6 ? [...p, s] : p))} className={cn("flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all", on ? "border-ember bg-ember-soft" : "border-border hover:bg-surface")} aria-pressed={on}>
                  <span><span className={cn("block text-[14.5px] font-semibold", on ? "text-ember" : "text-fg")}>{s}</span><span className="block text-[12.5px] text-fg-muted">{STRUGGLE_BLURBS[s]}</span></span>
                  <span className={cn("size-4 rounded-full border-2", on ? "border-ember bg-ember" : "border-border-strong")} />
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
            <Button size="lg" onClick={() => done.mutate()} loading={done.isPending}>{struggles.length ? "That's me" : "Skip for now"} <ArrowRight /></Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-up space-y-5">
          <div><h1 className="font-display text-[30px] leading-tight text-fg">You&apos;re in.</h1><p className="mt-1 text-[14px] text-fg-muted">{mine.data?.length ? "We put you in a couple of circles that match. Leave any of them whenever." : "Explore is where the people are. Ember is where the quiet is."}</p></div>
          {mine.data && mine.data.length > 0 && (
            <div className="space-y-2">{mine.data.map((c) => <Link key={c.id} href={`/circles/${c.slug}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface/70 p-3 hover:bg-surface"><CircleBadge icon={c.icon} hue={c.hue} size="sm" /><span className="min-w-0"><span className="block font-semibold text-fg">{c.name}</span><span className="block truncate text-[12.5px] text-fg-muted">{c.tagline}</span></span></Link>)}</div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="flex-1" onClick={() => { router.push("/home"); router.refresh(); }}>Go to my feed</Button>
            <Button size="lg" variant="soft" className="flex-1" asChild><Link href="/ember"><Sparkles /> Talk to Ember</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
}
