"use client";

import * as React from "react";
import { Ghost } from "lucide-react";
import { cn, hueFrom, initials } from "@/lib/utils";

type User = { username: string; displayName?: string | null; avatarUrl?: string | null };

const sizes = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-[12px]",
  md: "size-10 text-[13px]",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
  "2xl": "size-28 text-3xl",
};

export function Avatar({ user, size = "md", anonymous, className, ring }: { user?: User | null; size?: keyof typeof sizes; anonymous?: boolean; className?: string; ring?: boolean }) {
  const [broken, setBroken] = React.useState(false);
  const base = cn("relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold", sizes[size], ring && "ring-2 ring-bg", className);
  if (anonymous || !user) {
    return (
      <span className={cn(base, "bg-surface-2 text-fg-subtle")} aria-label="Anonymous">
        <Ghost className="size-[55%]" />
      </span>
    );
  }
  const name = user.displayName || user.username;
  const hue = hueFrom(user.username);
  if (user.avatarUrl && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt={name} onError={() => setBroken(true)} className={cn(base, "object-cover")} />;
  }
  return (
    <span
      className={base}
      style={{
        background: `linear-gradient(135deg, oklch(0.72 0.14 ${hue}), oklch(0.55 0.16 ${(hue + 50) % 360}))`,
        color: "white",
        textShadow: "0 1px 2px rgba(0,0,0,.25)",
      }}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}

export function UserName({ user, anonymous, className, withHandle = true }: { user: User; anonymous?: boolean; className?: string; withHandle?: boolean }) {
  if (anonymous) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-fg-muted", className)}>
        <span className="font-medium">Anonymous</span>
      </span>
    );
  }
  const name = user.displayName || user.username;
  return (
    <span className={cn("inline-flex min-w-0 items-baseline gap-1.5", className)}>
      <span className="truncate font-semibold text-fg">{name}</span>
      {withHandle && user.displayName && <span className="truncate text-[13px] text-fg-subtle">@{user.username}</span>}
    </span>
  );
}
