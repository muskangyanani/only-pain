"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-[34px] leading-tight text-fg">Something broke on our side.</h1>
      <p className="mt-3 max-w-sm text-[14.5px] text-fg-muted">Not you. Try again in a moment — and if tonight is heavy, the helplines still work.</p>
      {error.digest && <p className="mt-2 text-[11px] text-fg-subtle">ref {error.digest}</p>}
      <div className="mt-6 flex gap-2"><Button onClick={reset}>Try again</Button><Button asChild variant="outline"><Link href="/resources">Resources</Link></Button></div>
    </div>
  );
}
