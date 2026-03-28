import { Context } from "hono";
import { deleteCookie } from "hono/cookie";
import * as settingsService from "../services/settings.service.js";

export async function updateProfile(c: Context) {
  try {
    const userId = c.get("userId");
    const body = c.req.valid("json" as never);
    const user = await settingsService.updateProfile(userId, body);
    return c.json({ success: true, data: user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return c.json({ success: false, error: message }, 400);
  }
}

export async function changePassword(c: Context) {
  try {
    const userId = c.get("userId");
    const { currentPassword, newPassword } = c.req.valid("json" as never);
    const result = await settingsService.changePassword(
      userId,
      currentPassword,
      newPassword
    );
    return c.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return c.json({ success: false, error: message }, 400);
  }
}

export async function deleteAccount(c: Context) {
  try {
    const userId = c.get("userId");
    const { password } = c.req.valid("json" as never);
    const result = await settingsService.deleteAccount(userId, password);
    deleteCookie(c, "access_token");
    deleteCookie(c, "refresh_token");
    return c.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return c.json({ success: false, error: message }, 400);
  }
}
