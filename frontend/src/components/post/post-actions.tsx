"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api-client";
import { GuestPromptModal } from "@/components/guest/guest-prompt-modal";
import { Heart, MessageCircle, Share2 } from "lucide-react";

type PostActionsProps = {
  post: {
    id: string;
    hasReacted: boolean;
    _count: {
      comments: number;
      reactions: number;
    };
  };
};

export function PostActions({ post }: PostActionsProps) {
  const [hasReacted, setHasReacted] = useState(post.hasReacted);
  const [reactionCount, setReactionCount] = useState(post._count.reactions);
  const [guestModal, setGuestModal] = useState(false);
  const [guestAction, setGuestAction] = useState("");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  function requireAuth(action: string, callback: () => void) {
    if (isAuthenticated) {
      callback();
    } else {
      setGuestAction(action);
      setGuestModal(true);
    }
  }

  async function handleReact() {
    requireAuth("react to posts", async () => {
      const prevReacted = hasReacted;
      const prevCount = reactionCount;
      setHasReacted(!hasReacted);
      setReactionCount(hasReacted ? reactionCount - 1 : reactionCount + 1);

      const res = await api.post<{ reacted: boolean; count: number }>(
        `/api/posts/${post.id}/react`
      );

      if (!res.success) {
        setHasReacted(prevReacted);
        setReactionCount(prevCount);
      }
    });
  }

  function handleShare() {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast({ title: "Link copied to clipboard" });
  }

  return (
    <>
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 ${hasReacted ? "text-primary" : "text-muted-foreground"}`}
          onClick={handleReact}
        >
          <Heart
            className={`h-4 w-4 ${hasReacted ? "fill-current" : ""}`}
          />
          <span className="text-xs">{reactionCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => router.push(`/post/${post.id}`)}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">{post._count.comments}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          <span className="text-xs">Share</span>
        </Button>
      </div>

      <GuestPromptModal
        open={guestModal}
        onOpenChange={setGuestModal}
        action={guestAction}
      />
    </>
  );
}
