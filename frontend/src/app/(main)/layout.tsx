import { LeftSidebar } from "@/components/layout/left-sidebar";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ErrorBoundary } from "@/components/error-boundary";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-7xl">
      {/* Desktop 3-column layout */}
      <div className="flex">
        {/* Left sidebar - hidden on mobile */}
        <div className="hidden sm:flex sm:w-[72px] sm:shrink-0 sm:justify-end xl:w-[275px]">
          <LeftSidebar />
        </div>

        {/* Center content */}
        <main className="min-h-screen w-full max-w-[600px] border-x border-border pb-16 sm:pb-0">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>

        {/* Right sidebar - hidden below lg */}
        <div className="hidden lg:block lg:w-[350px] lg:shrink-0">
          <RightSidebar />
        </div>
      </div>

      {/* Mobile bottom nav - shown only on mobile */}
      <MobileNav />
    </div>
  );
}
