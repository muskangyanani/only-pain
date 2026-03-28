"use client";

import { CreatePostForm } from "@/components/post/create-post-form";
import { PostFeed } from "@/components/feed/post-feed";
import { useState } from "react";

export default function HomePage() {
  const [feedKey, setFeedKey] = useState(0);

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-foreground">Home</h1>
      </div>
      <CreatePostForm onPostCreated={() => setFeedKey((k) => k + 1)} />
      <PostFeed key={feedKey} />
    </div>
  );
}
