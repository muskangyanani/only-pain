"use client";

import { useParams } from "next/navigation";
import { qk } from "@/lib/query-keys";
import { TAG_LABELS, TAGS, type Tag } from "@/lib/constants";
import { Feed } from "@/components/feed/feed";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { useCompose } from "@/components/post/compose-provider";

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const compose = useCompose();
  if (!(TAGS as readonly string[]).includes(tag)) return <EmptyState title="Unknown tag" />;
  return (
    <div>
      <PageHeader back="/explore" title={<>#{TAG_LABELS[tag as Tag]}</>} subtitle="Everything tagged with this, newest first." actions={<Button size="sm" onClick={() => compose.open()}>Write</Button>} />
      <Feed queryKey={qk.tagPosts(tag)} path={`/api/explore/tags/${tag}/posts`} emptyTitle="Nothing under this tag yet" emptyBody="If this is what you're carrying, you could be the first to say so." />
    </div>
  );
}
