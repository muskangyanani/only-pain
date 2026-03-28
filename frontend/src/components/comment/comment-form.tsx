"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api-client";
import { Ghost, User } from "lucide-react";

type CommentFormProps = {
  postId: string;
  parentCommentId?: string;
  onCommentCreated?: () => void;
  placeholder?: string;
};

export function CommentForm({
  postId,
  parentCommentId,
  onCommentCreated,
  placeholder = "Share your thoughts...",
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  async function handleSubmit() {
    if (!content.trim()) return;
    setIsSubmitting(true);

    const res = await api.post(`/api/posts/${postId}/comments`, {
      content: content.trim(),
      isAnonymous,
      parentCommentId: parentCommentId || null,
    });

    if (res.success) {
      setContent("");
      onCommentCreated?.();
    }

    setIsSubmitting(false);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 300))}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        rows={2}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1 text-xs ${isAnonymous ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => setIsAnonymous(!isAnonymous)}
          >
            {isAnonymous ? <Ghost className="h-3 w-3" /> : <User className="h-3 w-3" />}
            {isAnonymous ? "Anon" : "You"}
          </Button>
          <span className="text-xs text-muted-foreground">{content.length}/300</span>
        </div>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? "..." : "Reply"}
        </Button>
      </div>
    </div>
  );
}
