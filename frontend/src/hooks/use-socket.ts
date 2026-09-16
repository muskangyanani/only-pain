"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useMe } from "@/hooks/use-me";
import { useLatest } from "@/hooks/use-now";
import type { Message, Notification, Page } from "@/lib/types";

let socket: Socket | null = null;
type Listener = (payload: unknown) => void;
const listeners = new Map<string, Set<Listener>>();

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

/** Subscribe to a socket event from any component. */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const ref = useLatest(handler);
  React.useEffect(() => {
    const fn: Listener = (p) => ref.current(p as T);
    const set = listeners.get(event) ?? new Set();
    set.add(fn);
    listeners.set(event, set);
    return () => {
      set.delete(fn);
    };
  }, [event, ref]);
}

function fanOut(event: string, payload: unknown) {
  listeners.get(event)?.forEach((fn) => fn(payload));
}

const NOTIF_COPY: Record<Notification["type"], (n: Notification) => string> = {
  COMMENT: (n) => `${label(n)} commented on your post`,
  REPLY: (n) => `${label(n)} replied to you`,
  REACTION: (n) => `${label(n)} reacted to your post`,
  FOLLOW: (n) => `${label(n)} started following you`,
  CIRCLE_JOIN: (n) => `${label(n)} joined ${n.circle?.name ?? "your circle"}`,
  DM_REQUEST: (n) => `${label(n)} sent you a message request`,
  DM_ACCEPTED: (n) => `${label(n)} accepted your message request`,
  DM_MESSAGE: (n) => `${label(n)}: new message`,
  SUPPORT: () => "A note from only pain",
  SYSTEM: () => "only pain",
};
const label = (n: Notification) => (n.actor?.id ? n.actor.displayName || n.actor.username : "Someone");

/** Mounted once inside Providers. Connects when logged in, wires events → cache. */
export function SocketBridge() {
  const { me } = useMe();
  const qc = useQueryClient();
  const pathname = usePathname();
  const pathRef = useLatest(pathname);

  React.useEffect(() => {
    if (!me) {
      disconnectSocket();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { token } = await api.get<{ token: string }>("/api/auth/socket-token");
        if (cancelled) return;
        const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";
        socket = io(url, { auth: { token }, withCredentials: true, transports: ["websocket", "polling"] });
        socket.onAny((event, payload) => fanOut(event, payload));

        socket.on("notification:new", (p: { notification: Notification; unread: number }) => {
          qc.setQueryData(qk.unread, p.unread);
          qc.invalidateQueries({ queryKey: qk.notifications });
          const n = p.notification;
          const onThatConvo = n.conversationId && pathRef.current === `/messages/${n.conversationId}`;
          if (n.type === "DM_MESSAGE" && onThatConvo) return;
          if (n.type === "DM_MESSAGE" || n.type === "DM_REQUEST" || n.type === "DM_ACCEPTED") qc.invalidateQueries({ queryKey: qk.dmUnread });
          toast(NOTIF_COPY[n.type]?.(n) ?? "New notification", { description: n.message ?? n.post?.preview ?? undefined });
        });

        socket.on("dm:message", (p: { conversationId: string; message: Message }) => {
          qc.setQueryData<InfiniteData<Page<Message>>>(qk.messages(p.conversationId), (old) => {
            if (!old) return old;
            const exists = old.pages.some((pg) => pg.data.some((m) => m.id === p.message.id));
            if (exists) return old;
            const pages = old.pages.map((pg, i) => (i === old.pages.length - 1 ? { ...pg, data: [...pg.data, p.message] } : pg));
            return { ...old, pages };
          });
          qc.invalidateQueries({ queryKey: ["conversations"] });
          qc.invalidateQueries({ queryKey: qk.dmUnread });
        });

        socket.on("dm:accepted", () => {
          qc.invalidateQueries({ queryKey: ["conversations"] });
          qc.invalidateQueries({ queryKey: ["conversation"] });
        });
      } catch {
        /* socket is best-effort */
      }
    })();
    return () => {
      cancelled = true;
      disconnectSocket();
    };
  }, [me?.id, qc, me, pathRef]);

  return null;
}
