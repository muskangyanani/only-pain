"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { PostCard } from "@/components/post/post-card";
import { CommentSection } from "@/components/comment/comment-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      const res = await api.get<Post>(`/api/posts/${params.id}`);
      if (res.success) {
        setPost(res.data);
      } else {
        setError(res.error);
      }
      setIsLoading(false);
    }
    fetchPost();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>{error || "Post not found"}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-2 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Post</h1>
      </div>
      <PostCard post={post} />
      <div className="px-4">
        <CommentSection postId={post.id} />
      </div>
    </div>
  );
}
