"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api-client";
import { detectCrisisKeywords } from "@/lib/crisis-keywords";
import { CrisisBanner } from "@/components/crisis/crisis-banner";
import { Ghost, User, ChevronDown, ChevronUp } from "lucide-react";

const VALID_TAGS = [
  "depression",
  "anxiety",
  "burnout",
  "grief",
  "intrusive-thoughts",
  "vent",
  "meme",
  "relationship",
  "loneliness",
  "recovery",
  "insomnia",
  "trauma",
];

export function CreatePostForm({ onPostCreated }: { onPostCreated?: () => void }) {
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  if (!isAuthenticated) return null;

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 3
          ? [...prev, tag]
          : prev
    );
  }

  async function handleSubmit() {
    if (!content.trim()) return;
    setIsSubmitting(true);

    const res = await api.post("/api/posts", {
      content: content.trim(),
      tags: selectedTags,
      isAnonymous,
    });

    if (res.success) {
      setContent("");
      setSelectedTags([]);
      setIsAnonymous(false);
      setShowTags(false);
      onPostCreated?.();
    } else {
      toast({
        title: "Failed to create post",
        description: "error" in res ? res.error : "Something went wrong",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  }

  return (
    <div className="border-b border-border p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
          {isAnonymous ? (
            <Ghost className="h-5 w-5" />
          ) : (
            user?.username[0]?.toUpperCase()
          )}
        </div>
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            placeholder="What's on your mind?"
            className="w-full resize-none bg-transparent text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
            rows={2}
          />

          {detectCrisisKeywords(content) && <CrisisBanner />}

          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleTag(tag)}
                >
                  #{tag} &times;
                </Badge>
              ))}
            </div>
          )}

          {/* Tag picker */}
          {showTags && (
            <div className="flex flex-wrap gap-1.5">
              {VALID_TAGS.filter((t) => !selectedTags.includes(t)).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer text-xs"
                  onClick={() => toggleTag(tag)}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1.5 text-xs ${isAnonymous ? "text-primary" : "text-muted-foreground"}`}
                onClick={() => setIsAnonymous(!isAnonymous)}
              >
                {isAnonymous ? <Ghost className="h-4 w-4" /> : <User className="h-4 w-4" />}
                {isAnonymous ? "Anonymous" : "As yourself"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-muted-foreground"
                onClick={() => setShowTags(!showTags)}
              >
                {showTags ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Tags
              </Button>
              <span className={`text-xs ${content.length > 450 ? "text-destructive" : "text-muted-foreground"}`}>
                {content.length}/500
              </span>
            </div>
            <Button
              size="sm"
              className="rounded-full px-5 font-bold"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
