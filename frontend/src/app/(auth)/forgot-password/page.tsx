"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const m = useMutation({ mutationFn: () => api.post("/api/auth/forgot-password", { email }), onError: (e: Error) => toast.error(e.message) });
  if (m.isSuccess) {
    return (
      <div className="animate-fade-up space-y-3">
        <h1 className="font-display text-[30px] text-fg">Check your inbox.</h1>
        <p className="text-[14px] text-fg-muted">If <strong className="text-fg">{email}</strong> has an account, a reset link is on its way. It works for an hour.</p>
        <Link href="/login" className="text-[13.5px] font-medium text-ember hover:underline">Back to log in</Link>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="animate-fade-up space-y-5">
      <div><h1 className="font-display text-[30px] text-fg">Forgot your password?</h1><p className="mt-1 text-[14px] text-fg-muted">Happens. We&apos;ll email you a link.</p></div>
      <Field label="Email" htmlFor="email"><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></Field>
      <Button type="submit" size="lg" className="w-full" loading={m.isPending}>Send reset link</Button>
      <Link href="/login" className="block text-center text-[13.5px] text-fg-muted hover:text-fg">Back to log in</Link>
    </form>
  );
}
