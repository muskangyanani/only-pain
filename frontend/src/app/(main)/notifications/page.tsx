"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/lib/time";
import { Bell, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetch() {
      const res = await api.get<Notification[]>("/api/notifications");
      if (res.success) {
        const full = res as unknown as { data: Notification[] };
        setNotifications(full.data);
      }
      setIsLoading(false);
    }
    fetch();
  }, [isAuthenticated]);

  async function markAllRead() {
    await api.patch("/api/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <p className="py-12 text-center text-muted-foreground">Log in to see notifications.</p>;
  }

  const typeLabels: Record<string, string> = {
    REPLY: "replied to your post",
    REACTION: "reacted to your post",
    FOLLOW: "started following you",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 pt-3">
        <h1 className="text-lg font-bold text-foreground">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-1 text-xs">
            <Check className="h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-muted-foreground">
          <Bell className="mb-2 h-8 w-8" />
          <p className="text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div>
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`border-b border-border px-4 py-3 ${n.isRead ? "bg-background" : "bg-card"}`}
            >
              <p className="text-sm text-foreground">
                Someone {typeLabels[n.type] || n.type}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(n.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
