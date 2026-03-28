"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/post/post-card";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";

const VALID_TAGS = [
  "depression", "anxiety", "burnout", "grief", "intrusive-thoughts",
  "vent", "meme", "relationship", "loneliness", "recovery", "insomnia", "trauma",
];

type Post = {
  id: string;
  content: string;
  imageUrl: string | null;
  isAnonymous: boolean;
  tags: string[];
  createdAt: string;
  hasReacted: boolean;
  author: { id: string | null; username: string; avatarUrl: string | null };
  _count: { comments: number; reactions: number };
};

type User = {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
};

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    setHasSearched(true);

    const [postRes, userRes] = await Promise.all([
      api.get<Post[]>(`/api/explore/posts?q=${encodeURIComponent(q)}`),
      api.get<User[]>(`/api/explore/users?q=${encodeURIComponent(q)}`),
    ]);

    if (postRes.success) {
      const full = postRes as unknown as { data: Post[] };
      setPosts(full.data);
    }
    if (userRes.success) {
      const full = userRes as unknown as { data: User[] };
      setUsers(full.data);
    }

    setIsSearching(false);
  }, []);

  let debounceTimer: ReturnType<typeof setTimeout>;
  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(value), 300);
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-foreground">Explore</h1>
      </div>
      <div className="relative px-4">
        <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search posts or users..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {!hasSearched && (
        <div className="px-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {VALID_TAGS.map((tag) => (
              <Link key={tag} href={`/explore/tag/${tag}`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isSearching && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {hasSearched && !isSearching && (
        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="space-y-4">
            {posts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No posts found.</p>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </TabsContent>
          <TabsContent value="users" className="space-y-3">
            {users.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
            ) : (
              users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 font-medium text-primary">
                    {user.username[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{user.username}</p>
                    {user.bio && (
                      <p className="truncate text-xs text-muted-foreground">{user.bio}</p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
