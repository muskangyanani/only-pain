"use client";

import * as React from "react";
import type { QueryKey } from "@tanstack/react-query";
import { Feather } from "lucide-react";
import type { Post } from "@/lib/types";
import { useInfinitePage, useLoadMore } from "@/hooks/use-infinite-page";
import { PostCard, PostSkeleton } from "@/components/post/post-card";
import { EmptyState, Spinner } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export function Feed({
  queryKey,
  path,
  params,
  enabled = true,
  emptyTitle = "Nothing here yet",
  emptyBody,
  emptyIcon,
  emptyAction,
}: {
  queryKey: QueryKey;
  path: string;
  params?: Record<string, string | number | undefined>;
  enabled?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
}) {
  const q = useInfinitePage<Post>(queryKey, path, { params, enabled });
  const sentinel = useLoadMore(q);
  if (q.isPending) return <FeedSkeleton />;
  if (q.isError) {
    return <EmptyState title="Couldn't load this" body={(q.error as Error).message} action={<Button variant="outline" onClick={() => q.refetch()}>Try again</Button>} />;
  }
  if (q.items.length === 0) return <EmptyState icon={emptyIcon ?? <Feather />} title={emptyTitle} body={emptyBody} action={emptyAction} />;
  return (
    <div className="space-y-3">
      {q.items.map((p, i) => (
        <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
          <PostCard post={p} />
        </div>
      ))}
      <div ref={sentinel} className="h-px" />
      {q.isFetchingNextPage && <div className="flex justify-center py-6"><Spinner /></div>}
      {!q.hasNextPage && q.items.length > 5 && <p className="py-8 text-center font-display text-[15px] italic text-fg-subtle">that&apos;s everything for now. go drink some water.</p>}
    </div>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => <PostSkeleton key={i} />)}
    </div>
  );
}
