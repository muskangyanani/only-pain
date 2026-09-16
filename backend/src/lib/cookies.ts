import type { Context } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { isProd } from "./env.js";
import { ACCESS_TTL_SEC, REFRESH_TTL_SEC } from "./tokens.js";

export const ACCESS_COOKIE = "op_access";
export const REFRESH_COOKIE = "op_refresh";

const base = {
  httpOnly: true,
  secure: isProd,
  sameSite: "Lax" as const,
  path: "/",
};

export function setAuthCookies(c: Context, accessToken: string, refreshToken: string) {
  setCookie(c, ACCESS_COOKIE, accessToken, { ...base, maxAge: ACCESS_TTL_SEC });
  setCookie(c, REFRESH_COOKIE, refreshToken, { ...base, maxAge: REFRESH_TTL_SEC });
}

export function clearAuthCookies(c: Context) {
  deleteCookie(c, ACCESS_COOKIE, { path: "/" });
  deleteCookie(c, REFRESH_COOKIE, { path: "/" });
}

export const readAccessCookie = (c: Context) => getCookie(c, ACCESS_COOKIE);
export const readRefreshCookie = (c: Context) => getCookie(c, REFRESH_COOKIE);
