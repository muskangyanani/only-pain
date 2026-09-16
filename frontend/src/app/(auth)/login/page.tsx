"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useLogin } from "@/hooks/use-auth-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useLogin();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const next = params.get("next") || "/home";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ identifier, password }, { onSuccess: () => { router.push(next.startsWith("/") ? next : "/home"); router.refresh(); }, onError: (err: Error) => toast.error(err.message) });
  };
  return (
    <form onSubmit={submit} className="animate-fade-up space-y-5">
      <div>
        <h1 className="font-display text-[32px] leading-tight text-fg">Welcome back.</h1>
        <p className="mt-1 text-[14px] text-fg-muted">No streak to protect. Just glad you&apos;re here.</p>
      </div>
      <Field label="Username or email" htmlFor="identifier"><Input id="identifier" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus /></Field>
      <Field label="Password" htmlFor="password"><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
      <Button type="submit" size="lg" className="w-full" loading={login.isPending}>Log in</Button>
      <div className="flex justify-between text-[13.5px] text-fg-muted">
        <Link href="/forgot-password" className="hover:text-fg">Forgot password?</Link>
        <Link href="/signup" className="font-medium text-ember hover:underline">Create account</Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return <React.Suspense fallback={null}><LoginForm /></React.Suspense>;
}
