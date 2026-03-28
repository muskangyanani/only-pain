"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { Search } from "lucide-react";

const TRENDING_TAGS = [
  { tag: "anxiety", count: "Trending" },
  { tag: "burnout", count: "Trending" },
  { tag: "recovery", count: "Trending" },
  { tag: "vent", count: "Trending" },
  { tag: "loneliness", count: "Trending" },
];

type UserResult = {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
};

export function RightSidebar() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setUsers([]);
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
    const res = await api.get<UserResult[]>(`/api/explore/users?q=${encodeURIComponent(q)}`);
    if (res.success) {
      const full = res as unknown as { data: UserResult[] };
      setUsers(full.data.slice(0, 5));
    }
  }, []);

  let debounceTimer: ReturnType<typeof setTimeout>;
  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(value), 300);
  }

  return (
    <aside className="sticky top-0 flex h-screen flex-col gap-4 overflow-y-auto py-4 pl-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="rounded-full bg-muted pl-10"
        />
      </div>

      {/* Search results */}
      {hasSearched && users.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <h3 className="px-4 pt-3 text-lg font-bold text-foreground">People</h3>
          <div className="py-2">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-accent"
                onClick={() => { setQuery(""); setHasSearched(false); }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {user.username[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{user.username}</p>
                  {user.bio && <p className="truncate text-xs text-muted-foreground">{user.bio}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      <div className="rounded-xl border border-border bg-card">
        <h3 className="px-4 pt-3 text-lg font-bold text-foreground">Trending Topics</h3>
        <div className="py-2">
          {TRENDING_TAGS.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/explore/tag/${tag}`}
              className="block px-4 py-2.5 transition-colors hover:bg-accent"
            >
              <p className="text-xs text-muted-foreground">{count}</p>
              <p className="font-semibold text-foreground">#{tag}</p>
            </Link>
          ))}
        </div>
        <Link
          href="/explore"
          className="block rounded-b-xl px-4 py-3 text-sm text-primary transition-colors hover:bg-accent"
        >
          Show more
        </Link>
      </div>

      {/* Footer */}
      <p className="px-4 text-xs text-muted-foreground">
        &copy; 2026 OnlyPain &middot; You&apos;re not alone.
      </p>
    </aside>
  );
}
