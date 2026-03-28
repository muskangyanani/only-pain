"use client";

import { useParams } from "next/navigation";
import { useCallback } from "react";
import { api } from "@/lib/api-client";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { PostCard } from "@/components/post/post-card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Post = {
  id: string;
  content: string;
  imageUrl: string | null;
  isAnonymous: boolean;
  tags: string[];
  createdAt: string;
  hasReacted: boolean;
  author: { id: string | null; username: string; avatarUrl: string | null };
  _count: { comments: number; reactions: number };
};

export default function TagPage() {
  const params = useParams();
  const tag = params.tag as string;

  const fetchPosts = useCallback(async (cursor: string | undefined) => {
    const searchParams = new URLSearchParams();
    if (cursor) searchParams.set("cursor", cursor);
    searchParams.set("limit", "10");

    const res = await api.get<Post[]>(`/api/explore/tags/${tag}?${searchParams}`);
    if (res.success) {
      const full = res as unknown as { data: Post[]; nextCursor: string | null; hasMore: boolean };
      return { data: full.data, nextCursor: full.nextCursor, hasMore: full.hasMore };
    }
    return { data: [], nextCursor: null, hasMore: false };
  }, [tag]);

  const { items, isLoading, isInitialLoad, hasMore, sentinelRef } =
    useInfiniteScroll<Post>(fetchPosts);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-sm">#{tag}</Badge>
        <span className="text-sm text-muted-foreground">posts</span>
      </div>

      {isInitialLoad ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No posts with this tag yet.</p>
      ) : (
        <>
          {items.map((post) => <PostCard key={post.id} post={post} />)}
          <div ref={sentinelRef} />
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
