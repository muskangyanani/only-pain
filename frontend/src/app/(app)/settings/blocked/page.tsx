"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Author } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/misc";

export default function BlockedPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.blocked, queryFn: () => api.get<(Author & { blockedAt: string })[]>("/api/users/me/blocked") });
  const unblock = useMutation({ mutationFn: (id: string) => api.post(`/api/users/${id}/block`), onSuccess: () => qc.invalidateQueries({ queryKey: qk.blocked }) });
  return (
    <div>
      <PageHeader back="/settings" title="Blocked" subtitle="They can't see you and you can't see them." />
      {q.isPending ? <div className="flex justify-center py-8"><Spinner /></div> : q.data!.length === 0 ? <EmptyState title="Nobody blocked" /> : (
        <div className="space-y-2">
          {q.data!.map((u) => (
            <div key={u.id} className="card-flat flex items-center gap-3 p-3">
              <Avatar user={{ username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl }} size="md" />
              <span className="flex-1 text-[14px] font-medium text-fg">{u.displayName || u.username} <span className="text-fg-subtle">@{u.username}</span></span>
              <Button size="xs" variant="outline" onClick={() => unblock.mutate(u.id!)}>Unblock</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
