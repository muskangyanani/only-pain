"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, EyeOff, Eye, Trash2, Ban, Check, Sparkles, UserRound } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Report } from "@/lib/types";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { useMe } from "@/hooks/use-me";
import { useInfinitePage, useLoadMore } from "@/hooks/use-infinite-page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, Segmented, Spinner } from "@/components/ui/misc";

const RISK_TONE: Record<string, "rose" | "gold" | "sky" | "neutral"> = { HIGH: "rose", MEDIUM: "gold", LOW: "sky", NONE: "neutral" };

function ReportCard({ r, onResolved }: { r: Report; onResolved: () => void }) {
  const [note, setNote] = React.useState("");
  const m = useMutation({
    mutationFn: (action: string) => api.post(`/api/mod/reports/${r.id}/resolve`, { action, note: note || null }),
    onSuccess: () => {
      toast("Done.");
      onResolved();
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
  const content = r.post?.content ?? r.comment?.content;
  const hidden = (r.post?.moderation ?? r.comment?.moderation) === "HIDDEN";
  return (
    <div className={cn("card p-4", r.riskLevel === "HIGH" && r.status === "OPEN" && "border-rose/40")}>
      <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
        <Badge tone={r.source === "AI" ? "violet" : "sky"}>{r.source === "AI" ? <><Sparkles className="size-3" /> AI</> : <><UserRound className="size-3" /> user</>}</Badge>
        <Badge>{r.reason.toLowerCase().replace(/_/g, " ")}</Badge>
        {r.riskLevel && <Badge tone={RISK_TONE[r.riskLevel]}>risk: {r.riskLevel.toLowerCase()}</Badge>}
        {hidden && <Badge tone="rose"><EyeOff className="size-3" /> hidden</Badge>}
        <span className="ml-auto text-fg-subtle">{timeAgo(r.createdAt)}</span>
      </div>
      {content && (
        <blockquote className="mt-3 whitespace-pre-wrap rounded-xl bg-surface px-3.5 py-3 text-[14px] leading-relaxed text-fg">{content}</blockquote>
      )}
      {r.details && <p className="mt-2 text-[13px] text-fg-muted"><span className="font-medium text-fg">Note:</span> {r.details}</p>}
      <div className="mt-2 flex flex-wrap gap-x-4 text-[12.5px] text-fg-muted">
        {r.targetUser && <span>author: <Link href={`/u/${r.targetUser.username}`} className="text-ember hover:underline">@{r.targetUser.username}</Link>{r.targetUser.isBanned ? " (banned)" : ""}{r.post?.isAnonymous || r.comment?.isAnonymous ? " · posted anonymously" : ""}</span>}
        {r.reporter && <span>reported by @{r.reporter.username}</span>}
        {r.post && <Link href={`/post/${r.post.id}`} className="text-ember hover:underline">open post</Link>}
        {r.comment && <Link href={`/post/${r.comment.postId}#comments`} className="text-ember hover:underline">open thread</Link>}
      </div>
      {r.status === "OPEN" ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note (optional)" className="h-8 min-w-[160px] flex-1 rounded-lg border border-border bg-surface px-2.5 text-[13px] outline-none focus:border-ember" />
          <Button size="xs" variant="ghost" onClick={() => m.mutate("dismiss")} loading={m.isPending}><Check /> Dismiss</Button>
          {content && (hidden ? <Button size="xs" variant="outline" onClick={() => m.mutate("restore")}><Eye /> Restore</Button> : <Button size="xs" variant="outline" onClick={() => m.mutate("hide")}><EyeOff /> Hide</Button>)}
          {content && <Button size="xs" variant="danger" onClick={() => m.mutate("remove")}><Trash2 /> Remove</Button>}
          {r.targetUser && (r.targetUser.isBanned ? <Button size="xs" variant="outline" onClick={() => m.mutate("unban")}>Unban</Button> : <Button size="xs" variant="danger" onClick={() => m.mutate("ban")}><Ban /> Ban</Button>)}
        </div>
      ) : (
        <p className="mt-3 border-t border-border pt-2 text-[12.5px] text-fg-subtle">{r.status.toLowerCase()} · {r.resolution}{r.resolvedBy ? ` · by @${r.resolvedBy.username}` : ""}</p>
      )}
    </div>
  );
}

export default function ModPage() {
  const { me } = useMe();
  const qc = useQueryClient();
  const [status, setStatus] = React.useState<"OPEN" | "RESOLVED" | "DISMISSED">("OPEN");
  const stats = useQuery({ queryKey: qk.modStats, queryFn: () => api.get<{ open: number; hidden: number; highRisk24h: number; users: number; posts: number }>("/api/mod/stats"), enabled: !!me && me.role !== "USER" });
  const q = useInfinitePage<Report>(qk.modReports(status), "/api/mod/reports", { params: { status }, enabled: !!me && me.role !== "USER" });
  const sentinel = useLoadMore(q);
  if (me && me.role === "USER") return <EmptyState icon={<Shield />} title="Moderators only" />;
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["mod-reports"] });
    qc.invalidateQueries({ queryKey: qk.modStats });
  };
  return (
    <div className="space-y-4">
      <PageHeader title="Moderation" subtitle="Reports from people and from the AI safety pass. High risk first." sticky={false} />
      {stats.data && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[["open", stats.data.open], ["hidden", stats.data.hidden], ["high risk · 24h", stats.data.highRisk24h], ["members", stats.data.users], ["posts", stats.data.posts]].map(([l, v]) => (
            <div key={String(l)} className="card-flat px-3.5 py-2.5"><p className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">{l}</p><p className="font-display text-[24px] leading-none text-fg">{v}</p></div>
          ))}
        </div>
      )}
      <Segmented value={status} onChange={setStatus} options={[{ value: "OPEN", label: "Open" }, { value: "RESOLVED", label: "Resolved" }, { value: "DISMISSED", label: "Dismissed" }]} />
      {q.isPending ? <div className="flex justify-center py-8"><Spinner /></div> : q.items.length === 0 ? <EmptyState icon={<Shield />} title="Queue is clear" body="Go drink some water." /> : (
        <div className="space-y-3">{q.items.map((r) => <ReportCard key={r.id} r={r} onResolved={refresh} />)}<div ref={sentinel} /></div>
      )}
    </div>
  );
}
