"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Circle } from "@/lib/types";
import { useMe } from "@/hooks/use-me";
import { useGuestGate } from "@/components/misc/guest-gate";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, Segmented, Spinner } from "@/components/ui/misc";
import { CircleCard, CreateCircleDialog } from "@/components/circles/circle-card";

export default function CirclesPage() {
  const { me } = useMe();
  const gate = useGuestGate();
  const [tab, setTab] = React.useState<"all" | "mine">("all");
  const [q, setQ] = React.useState("");
  const [create, setCreate] = React.useState(false);
  const circles = useQuery({ queryKey: qk.circles(q, tab === "mine"), queryFn: () => api.get<Circle[]>(`/api/circles?q=${encodeURIComponent(q)}${tab === "mine" ? "&mine=1" : ""}`) });
  return (
    <div className="space-y-4">
      <PageHeader title="Circles" subtitle="Small rooms for specific kinds of heavy." sticky={false} actions={<Button size="sm" onClick={() => gate("start a circle", () => setCreate(true))}><Plus /> Start one</Button>} />
      <div className="flex flex-wrap items-center gap-3">
        {me && <Segmented value={tab} onChange={setTab} options={[{ value: "all", label: "All" }, { value: "mine", label: "Mine" }]} />}
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a circle" className="h-10 rounded-full pl-10" />
        </div>
      </div>
      {circles.isPending ? <div className="flex justify-center py-10"><Spinner /></div> : circles.data!.length === 0 ? (
        <EmptyState title={tab === "mine" ? "You haven't joined any circles" : "No circles match"} body={tab === "mine" ? "Join one — or start the room you wish existed." : "Start it yourself; someone else is looking for it too."} action={<Button variant="outline" onClick={() => gate("start a circle", () => setCreate(true))}>Start a circle</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">{circles.data!.map((c) => <CircleCard key={c.id} circle={c} />)}</div>
      )}
      <CreateCircleDialog open={create} onOpenChange={setCreate} />
    </div>
  );
}
