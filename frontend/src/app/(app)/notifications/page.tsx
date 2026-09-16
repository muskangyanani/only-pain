"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Notification } from "@/lib/types";
import { useInfinitePage, useLoadMore } from "@/hooks/use-infinite-page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/misc";
import { NotificationItem } from "@/components/misc/notification-item";

export default function NotificationsPage() {
  const qc = useQueryClient();
  const q = useInfinitePage<Notification>(qk.notifications, "/api/notifications", { limit: 25 });
  const sentinel = useLoadMore(q);
  const readAll = useMutation({
    mutationFn: () => api.patch("/api/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications });
      qc.setQueryData(qk.unread, 0);
    },
  });
  const hasUnread = q.items.some((n) => !n.isRead);
  return (
    <div>
      <PageHeader title="Notifications" actions={hasUnread ? <Button size="sm" variant="ghost" onClick={() => readAll.mutate()}><CheckCheck /> Mark all read</Button> : undefined} />
      {q.isPending ? <div className="flex justify-center py-10"><Spinner /></div> : q.items.length === 0 ? (
        <EmptyState icon={<Bell />} title="Quiet for now" body="When someone reacts, replies or reaches out, it'll show up here." />
      ) : (
        <div className="space-y-1.5">
          {q.items.map((n) => <NotificationItem key={n.id} n={n} />)}
          <div ref={sentinel} />
          {q.isFetchingNextPage && <div className="flex justify-center py-4"><Spinner /></div>}
        </div>
      )}
    </div>
  );
}
