"use client";

import Link from "next/link";
import { formatDistanceToNow } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { Ghost, MessageCircle, Share2 } from "lucide-react";
import { PostActions } from "./post-actions";

type PostCardProps = {
  post: {
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
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="border-b border-border px-4 py-3 transition-colors hover:bg-accent/50">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        {post.isAnonymous ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Ghost className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
            {post.author.username[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex items-center gap-2">
          {post.isAnonymous ? (
            <span className="text-sm text-muted-foreground">Anonymous</span>
          ) : (
            <Link
              href={`/profile/${post.author.username}`}
              className="text-sm font-medium text-foreground hover:underline"
            >
              {post.author.username}
            </Link>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(post.createdAt)}
          </span>
        </div>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {post.tags.map((tag) => (
            <Link key={tag} href={`/explore/tag/${tag}`}>
              <Badge
                variant="secondary"
                className="cursor-pointer text-xs hover:bg-primary/20"
              >
                #{tag}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Content */}
      <Link href={`/post/${post.id}`} className="block">
        <p className="whitespace-pre-wrap text-foreground">{post.content}</p>
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post image"
            className="mt-3 max-h-96 w-full rounded-lg object-cover"
          />
        )}
      </Link>

      {/* Actions */}
      <PostActions post={post} />
    </article>
  );
}
