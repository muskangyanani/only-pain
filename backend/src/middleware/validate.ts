import type { Context } from "hono";

type HookResult = {
  success: boolean;
  error?: { issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }> };
};

/** Shared zValidator hook: consistent `{ success:false, error, code }` envelope on failure. */
export function validationHook(result: HookResult, c: Context) {
  if (!result.success) {
    const first = result.error?.issues[0];
    const path = first?.path?.length ? `${first.path.map(String).join(".")}: ` : "";
    return c.json({ success: false, error: `${path}${first?.message ?? "Invalid input"}`, code: "VALIDATION" }, 400);
  }
}
