"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ghost } from "lucide-react";
import { useSignup } from "@/hooks/use-auth-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const signup = useSignup();
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [agree, setAgree] = React.useState(false);
  const uOk = /^[a-z0-9_]{3,20}$/.test(username);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) return toast("Please confirm you're 16 or older.");
    signup.mutate({ username, email, password }, { onSuccess: () => { router.push("/onboarding"); router.refresh(); }, onError: (err: Error) => toast.error(err.message) });
  };
  return (
    <form onSubmit={submit} className="animate-fade-up space-y-5">
      <div>
        <h1 className="font-display text-[32px] leading-tight text-fg">Come as you are.</h1>
        <p className="mt-1 text-[14px] text-fg-muted">Free. Anonymous whenever you want. Leave any time.</p>
      </div>
      <Field label="Username" htmlFor="username" hint={username && !uOk ? "3–20 characters: lowercase letters, numbers, underscores" : "This is what people see unless you post anonymously."}>
        <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20))} placeholder="something that isn't your real name" required autoFocus />
      </Field>
      <Field label="Email" htmlFor="email" hint="Only for password resets and the occasional 'you okay?'."><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
      <Field label="Password" htmlFor="password" hint="8+ characters. A sentence works well."><Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></Field>
      <label className="flex items-start gap-3 text-[13px] text-fg-muted">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-4 accent-[var(--ember)]" />
        <span>I&apos;m 16 or older, and I&apos;ve read the <Link href="/guidelines" className="text-ember hover:underline">community guidelines</Link> and <Link href="/privacy" className="text-ember hover:underline">privacy note</Link>.</span>
      </label>
      <Button type="submit" size="lg" className="w-full" loading={signup.isPending} disabled={!uOk || password.length < 8}>Create account</Button>
      <p className="flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2.5 text-[12.5px] text-fg-muted"><Ghost className="size-4 shrink-0 text-violet" /> Anonymous posts are never linked to your name, even to moderators&apos; screens.</p>
      <p className="text-center text-[13.5px] text-fg-muted">Already here? <Link href="/login" className="font-medium text-ember hover:underline">Log in</Link></p>
    </form>
  );
}
