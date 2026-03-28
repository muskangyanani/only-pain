"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Home,
  Search,
  Bell,
  User,
  LogOut,
  PenSquare,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/notifications", label: "Notifications", icon: Bell, auth: true },
  { href: "/profile", label: "Profile", icon: User, auth: true },
];

export function LeftSidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <aside className="sticky top-0 flex h-screen flex-col justify-between py-4 pr-2">
      <div className="space-y-1">
        <Link
          href="/"
          className="mb-4 flex items-center rounded-full px-2 py-2 transition-colors hover:bg-primary/10"
        >
          {/* Collapsed: show OP icon */}
          <span className="text-xl font-black text-primary xl:hidden">OP</span>
          {/* Expanded: show full logo */}
          <span className="hidden xl:flex xl:items-baseline xl:gap-0.5">
            <span className="text-2xl font-bold tracking-tight text-foreground">Only</span>
            <span className="font-cursive text-[1.7rem] text-primary">Pain</span>
          </span>
        </Link>

        {NAV_ITEMS.map((item) => {
          if (item.auth && !isAuthenticated) return null;
          const href = item.href === "/profile" && user ? `/profile/${user.username}` : item.href;
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href === "/profile" ? "/profile" : item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={href}
              className={`flex items-center gap-4 rounded-full px-4 py-3 text-lg transition-colors hover:bg-accent ${
                isActive ? "font-bold text-foreground" : "text-foreground/80"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="hidden xl:inline">{item.label}</span>
            </Link>
          );
        })}

        <ThemeToggle />

        {isAuthenticated ? (
          <Button
            className="mt-4 w-full gap-2 rounded-full py-6 text-base font-bold xl:px-8"
            asChild
          >
            <Link href="/">
              <PenSquare className="h-5 w-5 xl:hidden" />
              <span className="hidden xl:inline">Post</span>
            </Link>
          </Button>
        ) : (
          <div className="mt-4 space-y-2">
            <Button className="w-full rounded-full py-5 font-bold" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
            <Button variant="outline" className="w-full rounded-full py-5 font-bold" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        )}
      </div>

      {isAuthenticated && user && (
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 rounded-full p-3 transition-colors hover:bg-accent"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
            {user.username[0]?.toUpperCase()}
          </div>
          <div className="hidden min-w-0 text-left xl:block">
            <p className="truncate text-sm font-semibold text-foreground">{user.username}</p>
            <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
          </div>
          <LogOut className="ml-auto hidden h-4 w-4 text-muted-foreground xl:block" />
        </button>
      )}
    </aside>
  );
}
