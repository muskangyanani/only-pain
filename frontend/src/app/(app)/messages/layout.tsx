"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConversationList } from "@/components/dm/conversations";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inThread = pathname !== "/messages";
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className={cn("lg:block", inThread && "hidden")}>
        <ConversationList className="lg:h-[calc(100dvh-2.5rem)]" />
      </div>
      <div className={cn(!inThread && "hidden lg:block")}>{children}</div>
    </div>
  );
}
