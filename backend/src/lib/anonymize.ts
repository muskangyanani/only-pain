/**
 * Core safety invariant.
 * Anonymous posts/comments keep the real authorId in the database, but it must
 * never leave the service layer. Every service that returns posts or comments
 * passes them through here before responding.
 */
export const ANONYMOUS_AUTHOR = {
  id: null,
  username: "anonymous",
  displayName: "Anonymous",
  avatarUrl: null,
} as const;

type Authored = {
  isAnonymous: boolean;
  authorId: string;
  author?: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

export type Anonymized<T extends Authored> = Omit<T, "authorId" | "author"> & {
  authorId: string | null;
  author: T["author"] | typeof ANONYMOUS_AUTHOR;
};

export function stripAnonymous<T extends Authored>(item: T, viewerId?: string | null): Anonymized<T> {
  if (!item.isAnonymous) return item as unknown as Anonymized<T>;
  // The author may still see that it's their own anonymous post (isMine) but
  // never the identity in the author field — the UI uses `isMine` instead.
  const isMine = !!viewerId && viewerId === item.authorId;
  return {
    ...item,
    authorId: null,
    author: { ...ANONYMOUS_AUTHOR },
    isMine,
  } as unknown as Anonymized<T>;
}

export function stripAnonymousMany<T extends Authored>(items: T[], viewerId?: string | null) {
  return items.map((i) => stripAnonymous(i, viewerId));
}
