"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Compass, Sparkles, Bell, UserRound, PenLine, Menu as MenuIcon, MessageCircle, Users, Leaf, Bookmark, Settings, LogOut, LifeBuoy, Crown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/use-me";
import { useUnread } from "@/hooks/use-unread";
import { useLogout } from "@/hooks/use-auth-actions";
import { useCompose } from "@/components/post/compose-provider";
import { Wordmark } from "@/components/brand/wordmark";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/misc/theme-toggle";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "radix-ui";
import * as React from "react";

export function MobileTopBar() {
  const { me, isLoading } = useMe();
  const [open, setOpen] = React.useState(false);
  const logout = useLogout();
  const unread = useUnread();
  const links = [
    { href: "/messages", label: "Messages", icon: MessageCircle, n: unread.messages },
    { href: "/circles", label: "Circles", icon: Users },
    { href: "/tools", label: "Tools", icon: Leaf },
    { href: "/bookmarks", label: "Saved", icon: Bookmark },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/plus", label: me?.plan === "PLUS" ? "Manage Plus" : "Get Plus", icon: Crown },
    ...(me?.role === "MOD" || me?.role === "ADMIN" ? [{ href: "/mod", label: "Moderation", icon: Shield }] : []),
    { href: "/resources", label: "Crisis resources", icon: LifeBuoy },
  ];
  return (
    <header className="glass sticky top-0 z-40 flex h-14 items-center justify-between px-4 md:hidden">
      <Wordmark href="/home" size="sm" />
      <div className="flex items-center gap-1">
        <ThemeToggle className="size-9 justify-center" />
        {me ? (
          <button onClick={() => setOpen(true)} className="relative rounded-full" aria-label="Menu">
            <Avatar user={me} size="sm" />
            {unread.messages > 0 && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-ember ring-2 ring-bg" />}
          </button>
        ) : !isLoading ? (
          <Button asChild size="sm"><Link href="/signup">Join</Link></Button>
        ) : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm" className="p-4">
          <VisuallyHidden.Root><DialogTitle>Menu</DialogTitle></VisuallyHidden.Root>
          {me && (
            <Link href={`/u/${me.username}`} onClick={() => setOpen(false)} className="mb-3 flex items-center gap-3 rounded-2xl bg-surface p-3">
              <Avatar user={me} size="lg" />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-fg">{me.displayName || me.username}</span>
                <span className="block truncate text-[13px] text-fg-subtle">@{me.username} · view profile</span>
              </span>
            </Link>
          )}
          <nav className="grid grid-cols-2 gap-1.5">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] text-fg hover:bg-surface">
                <l.icon className="size-[18px] text-fg-muted" /> {l.label}
                {"n" in l && l.n ? <span className="ml-auto rounded-full bg-ember px-1.5 text-[11px] font-bold text-ember-fg">{l.n}</span> : null}
              </Link>
            ))}
          </nav>
          <button onClick={() => { setOpen(false); logout.mutate(); }} className="mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] text-rose hover:bg-rose-soft">
            <LogOut className="size-[18px]" /> Log out
          </button>
        </DialogContent>
      </Dialog>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { me } = useMe();
  const unread = useUnread();
  const compose = useCompose();
  const items = [
    { href: "/home", icon: House, label: "Home" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { action: "compose" as const, icon: PenLine, label: "Write" },
    { href: "/ember", icon: Sparkles, label: "Ember", accent: true },
    me ? { href: "/notifications", icon: Bell, label: "Alerts", n: unread.notifications } : { href: "/login", icon: UserRound, label: "Log in" },
  ];
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-stretch justify-around px-2">
        {items.map((it) =>
          "action" in it ? (
            <button key="compose" onClick={() => compose.open()} className="flex flex-1 flex-col items-center justify-center py-2" aria-label="Write">
              <span className="flex size-11 items-center justify-center rounded-full bg-ember text-ember-fg shadow-glow"><it.icon className="size-5" /></span>
            </button>
          ) : (
            <Link key={it.href} href={it.href} className={cn("relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium", pathname.startsWith(it.href) ? "text-fg" : "text-fg-subtle", it.accent && "text-violet")}>
              <it.icon className="size-[22px]" strokeWidth={pathname.startsWith(it.href) ? 2.2 : 1.8} />
              {it.label}
              {"n" in it && it.n ? <span className="absolute right-[22%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-ember-fg">{it.n}</span> : null}
            </Link>
          )
        )}
      </div>
      <div className="h-px" />
      <span className="sr-only">{MenuIcon.name}</span>
    </nav>
  );
}
