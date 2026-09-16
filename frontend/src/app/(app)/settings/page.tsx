"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Crown, Download, LogOut, Monitor, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { STRUGGLES, STRUGGLE_BLURBS, LIMITS } from "@/lib/constants";
import type { Me } from "@/lib/types";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { useMe } from "@/hooks/use-me";
import { useLogout } from "@/hooks/use-auth-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch, Divider } from "@/components/ui/misc";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function Section({ title, description, children, id }: { title: string; description?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="card p-5 sm:p-6">
      <h2 className="font-display text-[21px] text-fg">{title}</h2>
      {description && <p className="mt-1 text-[13.5px] text-fg-muted">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { me } = useMe();
  if (!me) return null;
  return <SettingsForm me={me} />;
}

function SettingsForm({ me }: { me: Me }) {
  const qc = useQueryClient();
  const router = useRouter();
  const logout = useLogout();
  const [displayName, setDisplayName] = React.useState(me.displayName ?? "");
  const [pronouns, setPronouns] = React.useState(me.pronouns ?? "");
  const [bio, setBio] = React.useState(me.bio ?? "");
  const [avatarUrl, setAvatarUrl] = React.useState(me.avatarUrl ?? "");
  const [struggles, setStruggles] = React.useState<string[]>(me.struggles);
  const [username, setUsername] = React.useState(me.username);
  const [email, setEmail] = React.useState(me.email);
  const [emailPw, setEmailPw] = React.useState("");
  const [curPw, setCurPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  const [delPw, setDelPw] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const onOk = (msg: string) => (data: Me | unknown) => {
    if (data && typeof data === "object" && "username" in (data as Me)) qc.setQueryData(qk.me, data as Me);
    else qc.invalidateQueries({ queryKey: qk.me });
    toast(msg);
  };
  const onErr = (e: ApiError) => toast.error(e.message);

  const profile = useMutation({ mutationFn: (body: Record<string, unknown>) => api.patch<Me>("/api/settings/profile", body), onSuccess: onOk("Saved."), onError: onErr });
  const uname = useMutation({ mutationFn: () => api.patch<Me>("/api/settings/username", { username }), onSuccess: (m) => { onOk("Username changed.")(m); router.replace("/settings"); }, onError: onErr });
  const mail = useMutation({ mutationFn: () => api.patch<Me>("/api/settings/email", { email, password: emailPw }), onSuccess: (m) => { onOk("Email updated — check your inbox to verify.")(m); setEmailPw(""); }, onError: onErr });
  const pw = useMutation({ mutationFn: () => api.patch("/api/settings/password", { currentPassword: curPw, newPassword: newPw }), onSuccess: () => { toast("Password changed. Other devices were logged out."); setCurPw(""); setNewPw(""); qc.invalidateQueries({ queryKey: qk.sessions }); }, onError: onErr });
  const resend = useMutation({ mutationFn: () => api.post("/api/auth/resend-verification"), onSuccess: () => toast("Verification email sent."), onError: onErr });
  const del = useMutation({ mutationFn: () => api.delete("/api/settings/account", { password: delPw }), onSuccess: () => { qc.clear(); router.push("/"); toast("Your account is gone. Take care of yourself."); }, onError: onErr });
  const sessions = useQuery({ queryKey: qk.sessions, queryFn: () => api.get<{ id: string; userAgent: string | null; ip: string | null; lastUsedAt: string; isCurrent: boolean }[]>("/api/auth/sessions") });
  const revoke = useMutation({ mutationFn: (id: string) => api.delete(`/api/auth/sessions/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: qk.sessions }) });
  const logoutAll = useMutation({ mutationFn: () => api.post("/api/auth/logout-all"), onSuccess: () => logout.mutate() });

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" sticky={false} />

      <Section title="Profile" description="How you show up when you're not anonymous.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name" hint={`${displayName.length}/${LIMITS.displayName}`}><Input value={displayName} onChange={(e) => setDisplayName(e.target.value.slice(0, LIMITS.displayName))} placeholder="What people should call you" /></Field>
          <Field label="Pronouns"><Input value={pronouns} onChange={(e) => setPronouns(e.target.value.slice(0, 24))} placeholder="she/her, he/him, they/them…" /></Field>
        </div>
        <Field label="Bio" hint={`${bio.length}/${LIMITS.bio}`}><Textarea autoGrow rows={2} value={bio} onChange={(e) => setBio(e.target.value.slice(0, LIMITS.bio))} placeholder="One honest line." /></Field>
        <Field label="Avatar URL (optional)" hint="Leave empty for your generated avatar."><Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" /></Field>
        <div className="flex justify-end"><Button onClick={() => profile.mutate({ displayName: displayName || null, pronouns: pronouns || null, bio: bio || null, avatarUrl: avatarUrl || null })} loading={profile.isPending}>Save profile</Button></div>
      </Section>

      <Section title="What you're carrying" description="Shapes your For You feed and who we suggest. Pick up to six.">
        <div className="flex flex-wrap gap-2">
          {STRUGGLES.map((s) => (
            <button key={s} type="button" onClick={() => setStruggles((p) => (p.includes(s) ? p.filter((x) => x !== s) : p.length < 6 ? [...p, s] : p))} className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors", struggles.includes(s) ? "border-ember bg-ember-soft text-ember" : "border-border text-fg-muted hover:bg-surface")}>
              {s} <span className="text-[11.5px] opacity-70">· {STRUGGLE_BLURBS[s]}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end"><Button onClick={() => profile.mutate({ struggles })} loading={profile.isPending}>Save</Button></div>
      </Section>

      <Section title="Privacy" description="Defaults lean private. Change what you like.">
        <div className="flex items-center justify-between gap-4"><div><p className="text-[14px] font-medium text-fg">Show a 7-day mood ring on my profile</p><p className="text-[12.5px] text-fg-muted">Seven small dots. No scores, no notes.</p></div><Switch checked={me.showMoodOnProfile} onCheckedChange={(v) => profile.mutate({ showMoodOnProfile: v })} /></div>
        <Divider />
        <div><p className="text-[14px] font-medium text-fg">Who can send me message requests</p>
          <div className="mt-2 flex flex-wrap gap-2">{(["EVERYONE", "FOLLOWING", "NOBODY"] as const).map((v) => <button key={v} onClick={() => profile.mutate({ dmPrivacy: v })} className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-medium", me.dmPrivacy === v ? "border-ember bg-ember-soft text-ember" : "border-border text-fg-muted hover:bg-surface")}>{v === "EVERYONE" ? "Anyone" : v === "FOLLOWING" ? "Only people I follow" : "No one"}</button>)}</div>
        </div>
        <Divider />
        <div className="flex items-center justify-between gap-4"><div><p className="text-[14px] font-medium text-fg">Email me about replies and requests</p><p className="text-[12.5px] text-fg-muted">Never more than one digest a day.</p></div><Switch checked={me.emailNotifications} onCheckedChange={(v) => profile.mutate({ emailNotifications: v })} /></div>
        <Divider />
        <p className="text-[13px] text-fg-muted">Blocked people: <Link href="/settings/blocked" className="text-ember hover:underline">manage</Link></p>
      </Section>

      <Section title="Account" id="account">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field label="Username" hint="lowercase letters, numbers, underscores"><Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} /></Field>
          <Button variant="outline" onClick={() => uname.mutate()} disabled={username === me.username} loading={uname.isPending}>Change</Button>
        </div>
        <Divider />
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label={`Email ${me.emailVerified ? "· verified" : "· not verified"}`}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Current password"><Input type="password" value={emailPw} onChange={(e) => setEmailPw(e.target.value)} /></Field>
          <Button variant="outline" onClick={() => mail.mutate()} disabled={email === me.email || !emailPw} loading={mail.isPending}>Change</Button>
        </div>
        {!me.emailVerified && <Button variant="link" size="sm" className="px-0" onClick={() => resend.mutate()} loading={resend.isPending}>Resend verification email</Button>}
        <Divider />
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Current password"><Input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} /></Field>
          <Field label="New password" hint="8+ characters"><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></Field>
          <Button variant="outline" onClick={() => pw.mutate()} disabled={!curPw || newPw.length < 8} loading={pw.isPending}>Update</Button>
        </div>
      </Section>

      <Section title="Plus & billing">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] text-fg">{me.plan === "PLUS" ? <>You&apos;re on <strong>Plus</strong>{me.planRenewsAt ? ` · renews ${new Date(me.planRenewsAt).toLocaleDateString()}` : ""}</> : "You're on the free plan."}</p>
          <Button asChild variant={me.plan === "PLUS" ? "outline" : "soft"} size="sm"><Link href="/plus"><Crown /> {me.plan === "PLUS" ? "Manage" : "See Plus"}</Link></Button>
        </div>
      </Section>

      <Section title="Devices" description="Where you're logged in.">
        <div className="space-y-2">
          {sessions.data?.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-2.5 text-[13px]">
              <Monitor className="size-4 text-fg-subtle" />
              <span className="min-w-0 flex-1 truncate text-fg">{s.userAgent?.split(") ")[0]?.replace("(", " · ") ?? "Unknown device"}{s.isCurrent ? " · this device" : ""}</span>
              <span className="text-fg-subtle">{timeAgo(s.lastUsedAt)}</span>
              {!s.isCurrent && <button onClick={() => revoke.mutate(s.id)} className="text-rose hover:underline">revoke</button>}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => logoutAll.mutate()} loading={logoutAll.isPending}><LogOut /> Log out everywhere</Button>
      </Section>

      <Section title="Your data" description="Everything you've written, as JSON. It's yours.">
        <Button asChild variant="outline" size="sm"><a href="/api/users/me/export" download><Download /> Download my data</a></Button>
      </Section>

      <Section title="Danger zone">
        <p className="text-[13.5px] text-fg-muted">Deleting your account removes your posts, comments, messages, check-ins and Ember conversations. There is no undo, and we don&apos;t keep a copy.</p>
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}><Trash2 /> Delete my account</Button>
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent size="sm">
            <DialogHeader><DialogTitle>Delete everything?</DialogTitle><DialogDescription>Enter your password to confirm. If you&apos;re deleting because tonight is unbearable — please read <Link href="/resources" className="text-ember underline">this</Link> first. The account can wait.</DialogDescription></DialogHeader>
            <Input type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} placeholder="Your password" />
            <DialogFooter><Button variant="ghost" onClick={() => setConfirmDelete(false)}>Keep my account</Button><Button variant="danger" onClick={() => del.mutate()} disabled={!delPw} loading={del.isPending}>Delete forever</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>
    </div>
  );
}
