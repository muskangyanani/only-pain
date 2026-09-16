import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Wordmark />
      <h1 className="mt-8 font-display text-[40px] leading-none text-fg">This page wandered off.</h1>
      <p className="mt-3 max-w-sm text-[15px] text-fg-muted">Which, honestly, is relatable. Let&apos;s get you somewhere that exists.</p>
      <div className="mt-6 flex gap-2"><Button asChild><Link href="/home">Home</Link></Button><Button asChild variant="outline"><Link href="/resources">Crisis resources</Link></Button></div>
    </div>
  );
}
