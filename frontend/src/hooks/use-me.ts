"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Me } from "@/lib/types";

export async function fetchMe(): Promise<Me | null> {
  try {
    return await api.get<Me>("/api/auth/me");
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null;
    throw err;
  }
}

export function useMe() {
  const q = useQuery({ queryKey: qk.me, queryFn: fetchMe, staleTime: 5 * 60_000, retry: false });
  return { me: q.data ?? null, isLoading: q.isPending, isAuthed: !!q.data, refetch: q.refetch };
}

export function useSetMe() {
  const qc = useQueryClient();
  return (me: Me | null) => qc.setQueryData(qk.me, me);
}
