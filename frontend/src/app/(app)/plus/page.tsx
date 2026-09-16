"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Crown, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { PLUS_PRICE } from "@/lib/constants";
import type { BillingStatus } from "@/lib/types";
import { useMe } from "@/hooks/use-me";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

const FREE = ["Post, react, comment — anonymously or not", "Circles, DMs with request-gating", "Ember: 15 messages a day", "Untangle: 3 a day · reply ideas: 10 a day", "Mood check-ins & 30-day chart"];
const PLUS = ["Ember: as many messages as the night needs", "Untangle: 50 a day · reply ideas: 100 a day", "Weekly reflection written by Ember", "Plus badge, and our quiet gratitude", "You keep the lights on for people who can't pay"];

function PlusInner() {
  const { me } = useMe();
  const qc = useQueryClient();
  const params = useSearchParams();
  const status = useQuery({ queryKey: qk.billing, queryFn: () => api.get<BillingStatus>("/api/billing/status") });
  React.useEffect(() => {
    if (params.get("status") === "success") {
      toast("Welcome to Plus. Thank you — genuinely.");
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.billing });
    }
  }, [params, qc]);
  const checkout = useMutation({
    mutationFn: () => api.post<{ url: string }>("/api/billing/checkout"),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
  const portal = useMutation({
    mutationFn: () => api.post<{ url: string }>("/api/billing/portal"),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
  const isPlus = me?.plan === "PLUS";
  const enabled = status.data?.enabled ?? false;

  return (
    <div className="space-y-5">
      <PageHeader title={isPlus ? "You're on Plus" : "only pain plus"} subtitle={isPlus ? "Thank you. This is what keeps the free tier free." : "More Ember, more tools, and a way to keep this place running."} sticky={false} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-fg-subtle">Free</p>
          <p className="mt-1 font-display text-[34px] leading-none text-fg">₹0</p>
          <p className="mt-1 text-[13px] text-fg-muted">forever. this is the important tier.</p>
          <ul className="mt-5 space-y-2.5">{FREE.map((f) => <li key={f} className="flex gap-2.5 text-[14px] text-fg"><Check className="mt-0.5 size-4 shrink-0 text-sage" />{f}</li>)}</ul>
        </div>
        <div className="card relative overflow-hidden border-ember/40 p-6 shadow-glow">
          <div className="aurora"><span /><span /><span /></div>
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-ember"><Crown className="size-3.5" /> Plus</p>
            <p className="mt-1 font-display text-[34px] leading-none text-fg">{PLUS_PRICE}<span className="text-[16px] text-fg-muted"> / month</span></p>
            <p className="mt-1 text-[13px] text-fg-muted">cancel any time, no questions, no guilt.</p>
            <ul className="mt-5 space-y-2.5">{PLUS.map((f) => <li key={f} className="flex gap-2.5 text-[14px] text-fg"><Sparkles className="mt-0.5 size-4 shrink-0 text-ember" />{f}</li>)}</ul>
            <div className="mt-6">
              {isPlus ? (
                <Button size="lg" variant="outline" className="w-full" onClick={() => portal.mutate()} loading={portal.isPending} disabled={!enabled}>Manage subscription</Button>
              ) : enabled ? (
                <Button size="lg" className="w-full" onClick={() => checkout.mutate()} loading={checkout.isPending}><Crown /> Get Plus</Button>
              ) : (
                <Button size="lg" className="w-full" disabled>Payments open soon</Button>
              )}
              {!enabled && !isPlus && <p className="mt-2 text-center text-[12px] text-fg-subtle">Billing isn&apos;t switched on for this deployment yet.</p>}
              {isPlus && status.data?.renewsAt && <p className="mt-2 text-center text-[12px] text-fg-subtle">renews {new Date(status.data.renewsAt).toLocaleDateString()}</p>}
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-[13px] text-fg-subtle">Can&apos;t afford it and need more Ember? Email us. Nobody gets turned away for money.</p>
    </div>
  );
}

export default function PlusPage() {
  return (
    <React.Suspense fallback={null}>
      <PlusInner />
    </React.Suspense>
  );
}
