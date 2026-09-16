import type { Context } from "hono";

export type CursorQuery = { cursor: string | undefined; limit: number };

export function cursorQuery(c: Context, defaultLimit = 20, maxLimit = 50): CursorQuery {
  const cursor = c.req.query("cursor") || undefined;
  const raw = Number(c.req.query("limit"));
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(Math.floor(raw), maxLimit) : defaultLimit;
  return { cursor, limit };
}

/** Prisma cursor args: fetch limit + 1 and skip the cursor row itself. */
export function cursorArgs(cursor: string | undefined, limit: number) {
  return {
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };
}

/** Trim the extra row and produce the paginated envelope. */
export function paginate<T extends { id: string }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  return { data, nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null, hasMore };
}
