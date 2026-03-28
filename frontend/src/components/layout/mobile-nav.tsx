"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Home, Search, Bell, User } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const items = [
    { href: "/", icon: Home },
    { href: "/explore", icon: Search },
    ...(isAuthenticated
      ? [
          { href: "/notifications", icon: Bell },
          { href: `/profile/${user?.username}`, icon: User },
        ]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-sm sm:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full p-3 transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-6 w-6" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
