"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { CommentForm } from "./comment-form";
import { CommentCard } from "./comment-card";
import { Loader2 } from "lucide-react";

type Comment = {
  id: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  parentCommentId: string | null;
  author: { id: string | null; username: string; avatarUrl: string | null };
  replies?: Comment[];
};

export function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    const res = await api.get<Comment[]>(`/api/posts/${postId}/comments`);
    if (res.success) {
      const fullRes = res as unknown as { success: true; data: Comment[] };
      setComments(fullRes.data);
    }
    setIsLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h3>

      <CommentForm
        postId={postId}
        onCommentCreated={fetchComments}
      />

      {comments.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No comments yet.
        </p>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id}>
            <CommentCard
              comment={comment}
              onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              onDeleted={fetchComments}
            />

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-4 mt-2 space-y-2 sm:ml-8">
                {comment.replies.map((reply) => (
                  <CommentCard
                    key={reply.id}
                    comment={reply}
                    onDeleted={fetchComments}
                  />
                ))}
              </div>
            )}

            {/* Reply form */}
            {replyTo === comment.id && (
              <div className="ml-4 mt-2 sm:ml-8">
                <CommentForm
                  postId={postId}
                  parentCommentId={comment.id}
                  onCommentCreated={() => {
                    setReplyTo(null);
                    fetchComments();
                  }}
                  placeholder="Write a reply..."
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
