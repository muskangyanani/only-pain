"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { CompanionSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { EmberMark } from "@/components/brand/wordmark";

export default function EmberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const inChat = pathname !== "/ember";
  const sessions = useQuery({ queryKey: qk.companionSessions, queryFn: () => api.get<CompanionSession[]>("/api/companion/sessions") });
  const create = useMutation({
    mutationFn: () => api.post<CompanionSession>("/api/companion/sessions"),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: qk.companionSessions });
      router.push(`/ember/${s.id}`);
    },
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className={cn("lg:block", inChat && "hidden")}>
        <div className="flex items-center justify-between pb-3">
          <h1 className="inline-flex items-center gap-2 font-display text-[24px] text-fg"><EmberMark size={24} /> Ember</h1>
          <Button size="sm" onClick={() => create.mutate()} loading={create.isPending}><Plus /> New</Button>
        </div>
        <div className="space-y-1 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
          {sessions.data?.length === 0 && <p className="px-2 py-4 text-[13px] text-fg-subtle">Your conversations stay here, private to you. Delete any of them, any time.</p>}
          {sessions.data?.map((s) => (
            <Link key={s.id} href={`/ember/${s.id}`} className={cn("block rounded-2xl px-3.5 py-2.5 transition-colors", pathname === `/ember/${s.id}` ? "bg-surface" : "hover:bg-surface/70")}>
              <p className="truncate text-[14px] font-medium text-fg">{s.title || "New conversation"}</p>
              <p className="text-[12px] text-fg-subtle">{s._count?.messages ?? 0} messages · {timeAgo(s.updatedAt)}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className={cn(!inChat && "hidden lg:block")}>{children}</div>
    </div>
  );
}
