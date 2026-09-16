import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { getRedis } from "../lib/redis.js";
import { verifyAccessToken, verifySocketToken } from "../lib/tokens.js";
import { ACCESS_COOKIE } from "../lib/cookies.js";
import { bindEmitter } from "./emitter.js";

function cookieValue(header: string | undefined, name: string) {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
    serveClient: false,
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  const redis = getRedis();
  if (redis) {
    const sub = redis.duplicate();
    io.adapter(createAdapter(redis, sub));
    logger.info("socket.io redis adapter enabled");
  }

  io.use(async (socket, next) => {
    const token = typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token : undefined;
    let userId: string | null = null;
    if (token) userId = (await verifySocketToken(token))?.userId ?? null;
    if (!userId) {
      const cookie = cookieValue(socket.handshake.headers.cookie, ACCESS_COOKIE);
      if (cookie) userId = (await verifyAccessToken(cookie))?.userId ?? null;
    }
    if (!userId) return next(new Error("unauthorized"));
    socket.data.userId = userId;
    next();
  });

  const lastTouch = new Map<string, number>();

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    const touch = () => {
      const now = Date.now();
      if ((lastTouch.get(userId) ?? 0) + 5 * 60_000 < now) {
        lastTouch.set(userId, now);
        prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } }).catch(() => {});
      }
    };
    touch();

    socket.on("dm:typing", async (payload: { conversationId?: string; typing?: boolean }) => {
      if (!payload?.conversationId) return;
      const convo = await prisma.conversation.findUnique({
        where: { id: payload.conversationId },
        select: { userAId: true, userBId: true, status: true },
      });
      if (!convo || convo.status !== "ACCEPTED") return;
      if (convo.userAId !== userId && convo.userBId !== userId) return;
      const other = convo.userAId === userId ? convo.userBId : convo.userAId;
      io.to(`user:${other}`).emit("dm:typing", { conversationId: payload.conversationId, userId, typing: !!payload.typing });
      touch();
    });

    socket.on("presence:ping", touch);
  });

  bindEmitter(io);
  return io;
}
