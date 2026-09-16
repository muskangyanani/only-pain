"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useMe } from "@/hooks/use-me";

export function useUnread() {
  const { isAuthed } = useMe();
  const notifications = useQuery({
    queryKey: qk.unread,
    queryFn: () => api.get<{ count: number }>("/api/notifications/unread-count").then((r) => r.count),
    enabled: isAuthed,
    refetchInterval: 60_000,
  });
  const dm = useQuery({
    queryKey: qk.dmUnread,
    queryFn: () => api.get<{ messages: number; requests: number }>("/api/dm/unread"),
    enabled: isAuthed,
    refetchInterval: 60_000,
  });
  return { notifications: notifications.data ?? 0, messages: (dm.data?.messages ?? 0) + (dm.data?.requests ?? 0) };
}
