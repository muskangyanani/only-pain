export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CursorParams = {
  cursor?: string;
  limit?: number;
};
