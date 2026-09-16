import { SideNav } from "./side-nav";
import { RightRail } from "./right-rail";
import { MobileNav, MobileTopBar } from "./mobile-nav";

export function AppShell({ children, rail = true }: { children: React.ReactNode; rail?: boolean }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1240px] gap-5 md:px-5 xl:gap-8">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="min-w-0 flex-1 px-3 pb-24 pt-3 sm:px-4 md:pb-10 md:pt-5">{children}</main>
      </div>
      {rail && <RightRail />}
      <MobileNav />
    </div>
  );
}
