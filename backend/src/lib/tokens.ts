import { SignJWT, jwtVerify } from "jose";
import { env } from "./env.js";

const enc = new TextEncoder();
const accessKey = enc.encode(env.JWT_SECRET);
const refreshKey = enc.encode(env.JWT_REFRESH_SECRET);

export const ACCESS_TTL_SEC = 15 * 60;
export const REFRESH_TTL_SEC = 30 * 24 * 60 * 60;
export const SOCKET_TTL_SEC = 60 * 60;

type TokenKind = "access" | "refresh" | "socket";

async function sign(kind: TokenKind, userId: string, ttlSec: number, key: Uint8Array, jti?: string) {
  const jwt = new SignJWT({ kind })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSec);
  if (jti) jwt.setJti(jti);
  return jwt.sign(key);
}

async function verify(kind: TokenKind, token: string, key: Uint8Array) {
  try {
    const { payload } = await jwtVerify(token, key);
    if (payload.kind !== kind || typeof payload.sub !== "string") return null;
    return { userId: payload.sub, jti: payload.jti ?? null };
  } catch {
    return null;
  }
}

export const signAccessToken = (userId: string) => sign("access", userId, ACCESS_TTL_SEC, accessKey);
export const signRefreshToken = (userId: string, sessionId: string) =>
  sign("refresh", userId, REFRESH_TTL_SEC, refreshKey, sessionId);
export const signSocketToken = (userId: string) => sign("socket", userId, SOCKET_TTL_SEC, accessKey);

export const verifyAccessToken = (t: string) => verify("access", t, accessKey);
export const verifyRefreshToken = (t: string) => verify("refresh", t, refreshKey);
export const verifySocketToken = (t: string) => verify("socket", t, accessKey);
