import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { isProd } from "../lib/env.js";

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json({ success: false, error: err.message, code: err.code, ...err.extra }, err.status);
  }
  if (err instanceof HTTPException) {
    return c.json({ success: false, error: err.message || "Request failed", code: "HTTP" }, err.status);
  }
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => i.message).join(", ");
    return c.json({ success: false, error: message, code: "VALIDATION" }, 400);
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return c.json({ success: false, error: "That already exists.", code: "CONFLICT" }, 409);
    }
    if (err.code === "P2025") {
      return c.json({ success: false, error: "Not found.", code: "NOT_FOUND" }, 404);
    }
    if (err.code === "P2023") {
      return c.json({ success: false, error: "Malformed id.", code: "BAD_ID" }, 400);
    }
  }
  logger.error({ err, path: c.req.path, requestId: c.get("requestId") }, "unhandled error");
  return c.json(
    {
      success: false,
      error: isProd ? "Something went wrong on our side." : err.message,
      code: "INTERNAL",
    },
    500
  );
}
