import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Application error carrying an HTTP status and a machine-readable code. */
export class AppError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    message: string,
    public readonly code: string = "ERROR",
    public readonly extra?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (msg: string, code = "BAD_REQUEST", extra?: Record<string, unknown>) =>
  new AppError(400, msg, code, extra);
export const unauthorized = (msg = "Authentication required", code = "UNAUTHORIZED") =>
  new AppError(401, msg, code);
export const paymentRequired = (msg: string, code = "PLAN_REQUIRED", extra?: Record<string, unknown>) =>
  new AppError(402, msg, code, extra);
export const forbidden = (msg = "You can't do that", code = "FORBIDDEN") => new AppError(403, msg, code);
export const notFound = (what = "Resource") => new AppError(404, `${what} not found`, "NOT_FOUND");
export const conflict = (msg: string, code = "CONFLICT") => new AppError(409, msg, code);
export const tooMany = (msg: string, retryAfter: number) =>
  new AppError(429, msg, "RATE_LIMITED", { retryAfter });
