"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const m = useMutation({
    mutationFn: () => api.post("/api/auth/reset-password", { token, password }),
    onSuccess: () => { toast("Password updated. Log in with the new one."); router.push("/login"); },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!token) return <p className="text-[14px] text-fg-muted">This link is missing its token. <Link href="/forgot-password" className="text-ember hover:underline">Request a new one.</Link></p>;
  return (
    <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="animate-fade-up space-y-5">
      <div><h1 className="font-display text-[30px] text-fg">Choose a new password.</h1></div>
      <Field label="New password" htmlFor="password" hint="8+ characters"><Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoFocus /></Field>
      <Button type="submit" size="lg" className="w-full" loading={m.isPending} disabled={password.length < 8}>Update password</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return <React.Suspense fallback={null}><ResetForm /></React.Suspense>;
}
