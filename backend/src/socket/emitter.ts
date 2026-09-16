import type { Server } from "socket.io";

/**
 * Thin indirection so services can emit without importing the socket server
 * (which would create an import cycle through the auth/prisma modules).
 */
let io: Server | null = null;

export function bindEmitter(server: Server) {
  io = server;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function isUserOnline(userId: string) {
  return (io?.sockets.adapter.rooms.get(`user:${userId}`)?.size ?? 0) > 0;
}
