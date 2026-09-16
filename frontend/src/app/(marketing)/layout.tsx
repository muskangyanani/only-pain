import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <header className="sticky top-0 z-40">
        <div className="glass mx-auto mt-3 flex h-14 w-[calc(100%-1.5rem)] max-w-6xl items-center justify-between rounded-full px-4 sm:px-6">
          <Wordmark />
          <nav className="hidden items-center gap-6 text-[14px] text-fg-muted md:flex">
            <Link href="/#how" className="hover:text-fg">How it works</Link>
            <Link href="/#safety" className="hover:text-fg">Safety</Link>
            <Link href="/#plus" className="hover:text-fg">Plus</Link>
            <Link href="/home" className="hover:text-fg">Browse</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/login">Log in</Link></Button>
            <Button asChild size="sm"><Link href="/signup">Join</Link></Button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark size="sm" />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-fg-muted">A quiet corner of the internet for the heavy stuff. Peer support, not a medical service. Built in India, open to everyone.</p>
          </div>
          <div className="text-[13.5px]"><p className="mb-2 font-semibold text-fg">Product</p><ul className="space-y-1.5 text-fg-muted"><li><Link href="/home" className="hover:text-fg">Feed</Link></li><li><Link href="/circles" className="hover:text-fg">Circles</Link></li><li><Link href="/plus" className="hover:text-fg">Plus</Link></li></ul></div>
          <div className="text-[13.5px]"><p className="mb-2 font-semibold text-fg">Care</p><ul className="space-y-1.5 text-fg-muted"><li><Link href="/resources" className="hover:text-fg">Crisis resources</Link></li><li><Link href="/guidelines" className="hover:text-fg">Community guidelines</Link></li></ul></div>
          <div className="text-[13.5px]"><p className="mb-2 font-semibold text-fg">Legal</p><ul className="space-y-1.5 text-fg-muted"><li><Link href="/privacy" className="hover:text-fg">Privacy</Link></li><li><Link href="/terms" className="hover:text-fg">Terms</Link></li></ul></div>
        </div>
        <p className="pb-8 text-center text-[12px] text-fg-subtle">© {new Date().getFullYear()} only pain · If you&apos;re in immediate danger, call your local emergency number (India: 112).</p>
      </footer>
    </div>
  );
}
