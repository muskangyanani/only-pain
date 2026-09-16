"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";

function Verify() {
  const token = useSearchParams().get("token") ?? "";
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["verify", token], queryFn: () => api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`), enabled: !!token, retry: false });
  React.useEffect(() => {
    if (q.isSuccess) qc.invalidateQueries({ queryKey: qk.me });
  }, [q.isSuccess, qc]);
  return (
    <div className="animate-fade-up space-y-4">
      <h1 className="font-display text-[30px] text-fg">{q.isPending && token ? "Verifying…" : q.isSuccess ? "You're verified." : "That link didn't work."}</h1>
      {q.isPending && token ? <Spinner /> : q.isSuccess ? <p className="text-[14px] text-fg-muted">Thanks. Password resets and account recovery will work now.</p> : <p className="text-[14px] text-fg-muted">{(q.error as Error)?.message ?? "The link may be missing or expired."} You can request a new one from Settings.</p>}
      <Button asChild><Link href="/home">Go home</Link></Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <React.Suspense fallback={null}><Verify /></React.Suspense>;
}
