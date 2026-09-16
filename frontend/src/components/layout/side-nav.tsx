"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Compass, Users, MessageCircle, Bell, Sparkles, Leaf, Bookmark, Settings, LogOut, Crown, Shield, UserRound, PenLine, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/use-me";
import { useUnread } from "@/hooks/use-unread";
import { useLogout } from "@/hooks/use-auth-actions";
import { useCompose } from "@/components/post/compose-provider";
import { Wordmark, EmberMark } from "@/components/brand/wordmark";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/misc/theme-toggle";
import { Tip } from "@/components/ui/popover";

const NAV = [
  { href: "/home", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/circles", label: "Circles", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle, auth: true, badge: "messages" as const },
  { href: "/notifications", label: "Notifications", icon: Bell, auth: true, badge: "notifications" as const },
  { href: "/ember", label: "Ember", icon: Sparkles, auth: true, accent: true },
  { href: "/tools", label: "Tools", icon: Leaf, auth: true },
  { href: "/bookmarks", label: "Saved", icon: Bookmark, auth: true },
];

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-ember-fg xl:static xl:ml-auto xl:h-5 xl:min-w-5 xl:text-[11px]">{n > 99 ? "99+" : n}</span>;
}

export function SideNav() {
  const pathname = usePathname();
  const { me, isLoading } = useMe();
  const unread = useUnread();
  const logout = useLogout();
  const compose = useCompose();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col py-5 md:flex xl:w-[248px]">
      <div className="px-3 xl:px-4">
        <div className="hidden xl:block"><Wordmark href="/home" /></div>
        <Link href="/home" className="flex justify-center xl:hidden" aria-label="Home"><EmberMark size={30} /></Link>
      </div>

      <nav className="mt-6 flex flex-col gap-0.5 px-2 xl:px-3">
        {NAV.filter((n) => !n.auth || me).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const count = item.badge ? unread[item.badge] : 0;
          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-center gap-3.5 rounded-2xl px-3 py-2.5 text-[15px] transition-colors xl:justify-start",
                active ? "bg-surface font-semibold text-fg" : "text-fg-muted hover:bg-surface hover:text-fg",
                item.accent && !active && "text-violet hover:text-violet"
              )}
            >
              <span className="relative">
                <Icon className={cn("size-[22px] transition-transform group-hover:scale-105", item.accent && "text-violet")} strokeWidth={active ? 2.2 : 1.8} />
                <span className="xl:hidden"><Badge n={count} /></span>
              </span>
              <span className="hidden flex-1 xl:inline">{item.label}</span>
              <span className="hidden xl:contents"><Badge n={count} /></span>
            </Link>
          );
          return link;
        })}
      </nav>

      <div className="mt-4 px-2 xl:px-3">
        {me ? (
          <>
            <Button onClick={() => compose.open()} className="hidden w-full xl:inline-flex" size="lg"><PenLine /> Write</Button>
            <Tip label="Write" side="right"><Button onClick={() => compose.open()} size="icon" className="mx-auto flex size-12 xl:hidden" aria-label="Write"><PenLine /></Button></Tip>
          </>
        ) : !isLoading ? (
          <div className="flex flex-col gap-2">
            <Button asChild size="lg" className="hidden xl:inline-flex"><Link href="/signup">Join, it&apos;s free</Link></Button>
            <Button asChild variant="outline" className="hidden xl:inline-flex"><Link href="/login">Log in</Link></Button>
            <Tip label="Join" side="right"><Button asChild size="icon" className="mx-auto flex size-12 xl:hidden"><Link href="/signup" aria-label="Join"><UserRound /></Link></Button></Tip>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex flex-col gap-1 px-2 xl:px-3">
        <Link href="/resources" className="flex items-center justify-center gap-3.5 rounded-2xl px-3 py-2 text-[13.5px] text-fg-subtle transition-colors hover:bg-surface hover:text-fg xl:justify-start">
          <LifeBuoy className="size-5" /> <span className="hidden xl:inline">Crisis resources</span>
        </Link>
        <ThemeToggle className="justify-center px-3 py-2 text-[13.5px] xl:justify-start" withLabel />
        {me && (
          <Menu>
            <MenuTrigger asChild>
              <button className="mt-1 flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-surface xl:pr-3">
                <Avatar user={me} size="md" className="mx-auto xl:mx-0" />
                <span className="hidden min-w-0 flex-1 xl:block">
                  <span className="block truncate text-[14px] font-semibold text-fg">{me.displayName || me.username}</span>
                  <span className="block truncate text-[12.5px] text-fg-subtle">@{me.username}{me.plan === "PLUS" ? " · plus" : ""}</span>
                </span>
              </button>
            </MenuTrigger>
            <MenuContent align="start" side="top" className="w-56">
              <MenuItem asChild><Link href={`/u/${me.username}`}><UserRound /> Profile</Link></MenuItem>
              <MenuItem asChild><Link href="/settings"><Settings /> Settings</Link></MenuItem>
              <MenuItem asChild><Link href="/plus"><Crown /> {me.plan === "PLUS" ? "Manage Plus" : "Get Plus"}</Link></MenuItem>
              {(me.role === "MOD" || me.role === "ADMIN") && <MenuItem asChild><Link href="/mod"><Shield /> Moderation</Link></MenuItem>}
              <MenuSeparator />
              <MenuItem danger onSelect={() => logout.mutate()}><LogOut /> Log out</MenuItem>
            </MenuContent>
          </Menu>
        )}
      </div>
    </aside>
  );
}
