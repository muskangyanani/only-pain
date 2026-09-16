"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { MoodEntry, MoodSummary } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { MoodChart, MoodCheckIn, MoodStats } from "@/components/tools/mood";

export default function MoodPage() {
  const history = useQuery({ queryKey: qk.moodHistory(30), queryFn: () => api.get<MoodEntry[]>("/api/mood?days=30") });
  const summary = useQuery({ queryKey: qk.moodSummary, queryFn: () => api.get<MoodSummary>("/api/mood/summary") });
  return (
    <div className="space-y-4">
      <PageHeader back="/tools" title="Mood" subtitle="Noticing is the whole practice." />
      <MoodCheckIn />
      {summary.data && <MoodStats summary={summary.data} />}
      <MoodChart entries={history.data ?? []} days={30} />
    </div>
  );
}
