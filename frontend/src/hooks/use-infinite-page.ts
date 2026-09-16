"use client";

import * as React from "react";
import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { api, withCursor } from "@/lib/api";
import type { Page } from "@/lib/types";
import { useLatest } from "@/hooks/use-now";

export function useInfinitePage<T>(queryKey: QueryKey, path: string, opts: { enabled?: boolean; params?: Record<string, string | number | undefined>; limit?: number } = {}) {
  const q = useInfiniteQuery({
    queryKey,
    enabled: opts.enabled ?? true,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api.page<T>(withCursor(path, pageParam, { ...opts.params, limit: opts.limit })),
    getNextPageParam: (last: Page<T>) => (last.hasMore ? last.nextCursor : undefined),
  });
  const items = React.useMemo(() => q.data?.pages.flatMap((p) => p.data) ?? [], [q.data]);
  return { ...q, items };
}

/** Callback ref for the invisible "load more" sentinel at the end of a list. */
export function useLoadMore(q: { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => unknown }) {
  return useIntersection(() => {
    if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
  });
}

/** Callback ref: observe the sentinel element and fire when it scrolls into view. */
export function useIntersection(onIntersect: () => void, rootMargin = "600px") {
  const cb = useLatest(onIntersect);
  const observer = React.useRef<IntersectionObserver | null>(null);
  return React.useCallback(
    (el: HTMLDivElement | null) => {
      observer.current?.disconnect();
      observer.current = null;
      if (!el) return;
      observer.current = new IntersectionObserver((entries) => entries[0]?.isIntersecting && cb.current(), { rootMargin });
      observer.current.observe(el);
    },
    [rootMargin, cb]
  );
}
