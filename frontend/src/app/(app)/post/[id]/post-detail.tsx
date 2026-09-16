"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Post } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { PostCard, PostSkeleton } from "@/components/post/post-card";
import { CommentThread } from "@/components/post/comment-thread";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export function PostDetail({ id }: { id: string }) {
  const q = useQuery({ queryKey: qk.post(id), queryFn: () => api.get<Post>(`/api/posts/${id}`) });
  return (
    <div>
      <PageHeader back title="Post" />
      {q.isPending ? <PostSkeleton /> : q.isError || !q.data ? (
        <EmptyState title="This post isn't here" body="It may have been deleted, or it's been hidden while someone takes a look." action={<Button asChild variant="outline"><Link href="/home">Back home</Link></Button>} />
      ) : (
        <div className="space-y-6">
          <PostCard post={q.data} detail />
          <CommentThread postId={id} commentCount={q.data.commentCount} />
        </div>
      )}
    </div>
  );
}
