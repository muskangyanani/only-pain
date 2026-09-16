"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { CompanionSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmberMark } from "@/components/brand/wordmark";

export default function EmberIndex() {
  const router = useRouter();
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: () => api.post<CompanionSession>("/api/companion/sessions"),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: qk.companionSessions });
      router.push(`/ember/${s.id}`);
    },
  });
  return (
    <div className="card relative overflow-hidden p-8 text-center sm:p-12">
      <div className="aurora"><span /><span /><span /></div>
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-violet-soft"><EmberMark size={44} /></div>
        <h2 className="mt-5 font-display text-[30px] leading-tight text-fg">Someone to talk to, any hour.</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-fg-muted text-pretty">Ember listens first, doesn&apos;t flinch, and keeps a few small tools in its pocket — breathing, grounding, untangling the thought that&apos;s looping. It&apos;s an AI companion, not a therapist, and it&apos;ll always hand you to a human line when it matters.</p>
        <Button size="lg" className="mt-6" onClick={() => create.mutate()} loading={create.isPending}>Start talking</Button>
        <p className="mt-4 text-[12.5px] text-fg-subtle">Free: 15 messages a day. Plus: as many as the night needs.</p>
      </div>
    </div>
  );
}
