"use client";

import { Bookmark } from "lucide-react";
import { qk } from "@/lib/query-keys";
import { Feed } from "@/components/feed/feed";
import { PageHeader } from "@/components/layout/page-header";

export default function BookmarksPage() {
  return (
    <div>
      <PageHeader title="Saved" subtitle="Posts you wanted to come back to." />
      <Feed queryKey={qk.bookmarks} path="/api/users/me/bookmarks" emptyIcon={<Bookmark />} emptyTitle="Nothing saved yet" emptyBody="Tap the bookmark on a post that you want to reread on a worse day." />
    </div>
  );
}
