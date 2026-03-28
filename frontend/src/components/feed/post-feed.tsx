"use client";

import { useCallback } from "react";
import { api } from "@/lib/api-client";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { PostCard } from "@/components/post/post-card";
import { Loader2 } from "lucide-react";

type Post = {
  id: string;
  content: string;
  imageUrl: string | null;
  isAnonymous: boolean;
  tags: string[];
  createdAt: string;
  hasReacted: boolean;
  author: {
    id: string | null;
    username: string;
    avatarUrl: string | null;
  };
  _count: {
    comments: number;
    reactions: number;
  };
};

type FeedResponse = {
  data: Post[];
  nextCursor: string | null;
  hasMore: boolean;
};

export function PostFeed() {
  const fetchPosts = useCallback(async (cursor: string | undefined) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", "10");

    const res = await api.get<Post[]>(`/api/feed?${params}`);

    if (res.success) {
      // The response includes nextCursor and hasMore at top level
      const fullRes = res as unknown as { success: true } & FeedResponse;
      return {
        data: fullRes.data,
        nextCursor: fullRes.nextCursor,
        hasMore: fullRes.hasMore,
      };
    }

    return { data: [], nextCursor: null, hasMore: false };
  }, []);

  const { items, isLoading, isInitialLoad, hasMore, sentinelRef, reset } =
    useInfiniteScroll<Post>(fetchPosts);

  if (isInitialLoad) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No posts yet. Be the first to share.</p>
      </div>
    );
  }

  return (
    <div>
      {items.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} />

      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          You&apos;ve reached the end.
        </p>
      )}
    </div>
  );
}
