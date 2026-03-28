"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type FetchResult<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export function useInfiniteScroll<T>(
  fetchFn: (cursor: string | undefined) => Promise<FetchResult<T>>
) {
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<string | undefined>(undefined);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);

    try {
      const result = await fetchFn(cursorRef.current);
      setItems((prev) => [...prev, ...result.data]);
      cursorRef.current = result.nextCursor ?? undefined;
      setHasMore(result.hasMore);
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [fetchFn]);

  // Initial load
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingRef.current) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const reset = useCallback(() => {
    setItems([]);
    cursorRef.current = undefined;
    setHasMore(true);
    setIsLoading(false);
    setIsInitialLoad(true);
    loadingRef.current = false;
  }, []);

  return {
    items,
    isLoading,
    isInitialLoad,
    hasMore,
    sentinelRef,
    reset,
    setItems,
  };
}
