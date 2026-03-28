import { Context } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import * as authService from "../services/auth.service.js";
import { env } from "../lib/env.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax" as const,
  path: "/",
};

export async function signup(c: Context) {
  try {
    const { username, email, password } = c.req.valid("json" as never);
    const result = await authService.signup(username, email, password);
    return c.json({ success: true, data: result }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signup failed";
    return c.json({ success: false, error: message }, 400);
  }
}

export async function verifyEmail(c: Context) {
  try {
    const { token } = c.req.valid("query" as never);
    const result = await authService.verifyEmail(token);
    return c.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return c.json({ success: false, error: message }, 400);
  }
}

export async function login(c: Context) {
  try {
    const { username, password } = c.req.valid("json" as never);
    const { accessToken, refreshToken, user } = await authService.login(
      username,
      password
    );

    setCookie(c, "access_token", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 15, // 15 minutes
    });

    setCookie(c, "refresh_token", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return c.json({ success: true, data: user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return c.json({ success: false, error: message }, 401);
  }
}

export async function refreshToken(c: Context) {
  try {
    const currentRefreshToken = getCookie(c, "refresh_token");
    if (!currentRefreshToken) {
      return c.json({ success: false, error: "No refresh token" }, 401);
    }

    const { accessToken, refreshToken } =
      await authService.refreshTokens(currentRefreshToken);

    setCookie(c, "access_token", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 15,
    });

    setCookie(c, "refresh_token", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 7,
    });

    return c.json({ success: true, data: { message: "Tokens refreshed" } });
  } catch (err) {
    deleteCookie(c, "access_token");
    deleteCookie(c, "refresh_token");
    return c.json({ success: false, error: "Invalid refresh token" }, 401);
  }
}

export async function logout(c: Context) {
  const userId = c.get("userId");
  await authService.logout(userId);

  deleteCookie(c, "access_token");
  deleteCookie(c, "refresh_token");

  return c.json({ success: true, data: { message: "Logged out" } });
}

export async function me(c: Context) {
  try {
    const userId = c.get("userId");
    const user = await authService.getMe(userId);
    return c.json({ success: true, data: user });
  } catch (err) {
    return c.json({ success: false, error: "User not found" }, 404);
  }
}
