import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export async function errorHandler(err: Error, c: Context) {
  console.error(`[Error] ${err.message}`, err.stack);

  if (err instanceof HTTPException) {
    return c.json({ success: false, error: err.message }, err.status);
  }

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join(", ");
    return c.json({ success: false, error: message }, 400);
  }

  return c.json({ success: false, error: "Internal server error" }, 500);
}
