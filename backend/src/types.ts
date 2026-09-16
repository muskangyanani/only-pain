import type { Plan, Role } from "@prisma/client";

export type AppVariables = {
  userId: string | null;
  /** Populated only by requireRole / loadUser. */
  currentUser?: { id: string; role: Role; plan: Plan; isBanned: boolean; username: string };
  requestId: string;
};

export type ApiOk<T> = { success: true; data: T };
export type ApiErr = { success: false; error: string; code?: string };
export type Paginated<T> = { success: true; data: T[]; nextCursor: string | null; hasMore: boolean };
