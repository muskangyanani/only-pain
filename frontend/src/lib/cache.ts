import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Page, Post } from "@/lib/types";

type Patch = Partial<Post> | ((p: Post) => Post);
const apply = (p: Post, patch: Patch) => (typeof patch === "function" ? patch(p) : { ...p, ...patch });

const POST_LIST_KEYS = ["feed", "user-posts", "anon-posts", "bookmarks", "circle-posts", "tag-posts", "search"];

/** Optimistically patch a post wherever it lives in the cache (lists + detail). */
export function patchPostInCaches(qc: QueryClient, postId: string, patch: Patch) {
  qc.setQueryData<Post>(["post", postId], (old) => (old ? apply(old, patch) : old));
  for (const key of POST_LIST_KEYS) {
    qc.setQueriesData<InfiniteData<Page<Post>>>({ queryKey: [key] }, (old) => {
      if (!old?.pages) return old;
      let touched = false;
      const pages = old.pages.map((pg) => {
        if (!pg.data.some((p) => p.id === postId)) return pg;
        touched = true;
        return { ...pg, data: pg.data.map((p) => (p.id === postId ? apply(p, patch) : p)) };
      });
      return touched ? { ...old, pages } : old;
    });
  }
}

export function removePostFromCaches(qc: QueryClient, postId: string) {
  qc.removeQueries({ queryKey: ["post", postId] });
  for (const key of POST_LIST_KEYS) {
    qc.setQueriesData<InfiniteData<Page<Post>>>({ queryKey: [key] }, (old) => {
      if (!old?.pages) return old;
      return { ...old, pages: old.pages.map((pg) => ({ ...pg, data: pg.data.filter((p) => p.id !== postId) })) };
    });
  }
}

export function prependPostToFeeds(qc: QueryClient, post: Post) {
  for (const key of [["feed", "latest"], ["feed", "foryou"], ["user-posts"], ["circle-posts"]]) {
    qc.setQueriesData<InfiniteData<Page<Post>>>({ queryKey: key }, (old) => {
      if (!old?.pages?.length) return old;
      if (key[0] === "user-posts" && post.isAnonymous) return old;
      const [first, ...rest] = old.pages;
      if (first!.data.some((p) => p.id === post.id)) return old;
      return { ...old, pages: [{ ...first!, data: [post, ...first!.data] }, ...rest] };
    });
  }
}
