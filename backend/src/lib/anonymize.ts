type PostWithAuthor = {
  isAnonymous: boolean;
  authorId: string;
  author?: {
    id: string;
    username: string;
    avatarUrl: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

type AnonymizedPost<T extends PostWithAuthor> = Omit<T, "authorId" | "author"> & {
  authorId: string | null;
  author: {
    id: string | null;
    username: string;
    avatarUrl: null;
  } | T["author"];
};

export function stripAnonymous<T extends PostWithAuthor>(
  item: T
): AnonymizedPost<T> {
  if (!item.isAnonymous) {
    return item as unknown as AnonymizedPost<T>;
  }

  return {
    ...item,
    authorId: null,
    author: {
      id: null,
      username: "Anonymous",
      avatarUrl: null,
    },
  };
}

export function stripAnonymousMany<T extends PostWithAuthor>(
  items: T[]
): AnonymizedPost<T>[] {
  return items.map(stripAnonymous);
}
