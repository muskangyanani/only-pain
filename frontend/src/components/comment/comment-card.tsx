"use client";

import { formatDistanceToNow } from "@/lib/time";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Ghost, Reply, Trash2 } from "lucide-react";

type CommentCardProps = {
  comment: {
    id: string;
    content: string;
    isAnonymous: boolean;
    createdAt: string;
    author: { id: string | null; username: string; avatarUrl: string | null };
  };
  onReply?: () => void;
  onDeleted?: () => void;
};

export function CommentCard({ comment, onReply, onDeleted }: CommentCardProps) {
  const { user } = useAuth();
  const isOwn = user?.id === comment.author.id;

  async function handleDelete() {
    const res = await api.delete(`/api/posts/comments/${comment.id}`);
    if (res.success) onDeleted?.();
  }

  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="mb-1 flex items-center gap-2">
        {comment.isAnonymous ? (
          <Ghost className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-medium text-primary">
            {comment.author.username[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-xs font-medium text-foreground">
          {comment.isAnonymous ? "Anonymous" : comment.author.username}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(comment.createdAt)}
        </span>
      </div>
      <p className="text-sm text-foreground">{comment.content}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {onReply && (
          <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs text-muted-foreground" onClick={onReply}>
            <Reply className="h-3 w-3" /> Reply
          </Button>
        )}
        {isOwn && (
          <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs text-destructive" onClick={handleDelete}>
            <Trash2 className="h-3 w-3" /> Delete
          </Button>
        )}
      </div>
    </div>
  );
}
