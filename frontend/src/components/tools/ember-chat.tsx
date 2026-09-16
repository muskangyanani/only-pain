"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { api, ApiError, streamSSE } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { LIMITS } from "@/lib/constants";
import type { CompanionMessage, CompanionSession } from "@/lib/types";
import { useMe } from "@/hooks/use-me";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { EmberMark } from "@/components/brand/wordmark";
import { CrisisResources } from "@/components/misc/crisis-resources";

const STARTERS = [
  "I can't switch my brain off tonight.",
  "I don't even know what's wrong, just… heavy.",
  "Can you walk me through something to calm down?",
  "I keep replaying a conversation from today.",
];

function EmberBubble({ content, streaming }: { content: string; streaming?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-soft"><EmberMark size={18} /></span>
      <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-md bg-surface px-4 py-3 text-[15px] leading-relaxed text-fg">
        <p className="whitespace-pre-wrap">{content}{streaming && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse-soft bg-ember align-middle" />}</p>
      </div>
    </div>
  );
}

export function EmberChat({ sessionId }: { sessionId: string }) {
  const { me } = useMe();
  const qc = useQueryClient();
  const router = useRouter();
  const session = useQuery({ queryKey: qk.companionSession(sessionId), queryFn: () => api.get<CompanionSession & { messages: CompanionMessage[] }>(`/api/companion/sessions/${sessionId}`) });
  const [local, setLocal] = React.useState<CompanionMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [streaming, setStreaming] = React.useState<string | null>(null);
  const [crisis, setCrisis] = React.useState(false);
  const bottom = React.useRef<HTMLDivElement>(null);
  const localCounter = React.useRef(0);
  const messages = React.useMemo(() => [...(session.data?.messages ?? []), ...local], [session.data?.messages, local]);

  React.useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, streaming]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || streaming !== null) return;
    setDraft("");
    localCounter.current += 1;
    const userMsg: CompanionMessage = { id: `local-${localCounter.current}`, role: "USER", content, createdAt: "" };
    setLocal((l) => [...l, userMsg]);
    setStreaming("");
    let full = "";
    try {
      await streamSSE(`/api/companion/sessions/${sessionId}/messages`, { content }, {
        onEvent: (event, data) => {
          if (event === "meta" && (data.crisis === "HIGH" || data.crisis === "MEDIUM")) setCrisis(true);
          if (event === "delta") {
            full += data.text as string;
            setStreaming(full);
          }
          if (event === "error") toast.error(String(data.error));
          if (event === "done") {
            setLocal((l) => [...l, { id: data.messageId as string, role: "ASSISTANT", content: (data.content as string) || full, createdAt: "" }]);
            qc.invalidateQueries({ queryKey: qk.companionSessions });
          }
        },
      });
    } catch (err) {
      const e = err as ApiError;
      setLocal((l) => l.filter((m) => m.id !== userMsg.id));
      setDraft(content);
      if (e.isQuota) {
        toast(e.message, { duration: 8000, action: e.extra.upgradeAvailable ? { label: "See Plus", onClick: () => router.push("/plus") } : undefined });
      } else toast.error(e.message || "Ember lost the thread.");
    } finally {
      setStreaming(null);
    }
  };

  const del = async () => {
    await api.delete(`/api/companion/sessions/${sessionId}`);
    qc.invalidateQueries({ queryKey: qk.companionSessions });
    router.push("/ember");
  };

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col md:h-[calc(100dvh-2.5rem)]">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-violet-soft"><EmberMark size={20} /></span>
          <div>
            <p className="font-display text-[18px] leading-tight text-fg">Ember</p>
            <p className="text-[12px] text-fg-subtle">a companion, not a clinician · private to you</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={del} aria-label="Delete conversation"><Trash2 /></Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-4 pr-1">
        {session.isPending ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : messages.length === 0 && streaming === null ? (
          <div className="mx-auto max-w-md py-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-violet-soft"><EmberMark size={34} /></div>
            <h2 className="mt-4 font-display text-[24px] text-fg">Hey. I&apos;m Ember.</h2>
            <p className="mt-2 text-[14.5px] text-fg-muted text-pretty">I&apos;m here to listen — properly — and sometimes to offer something small that might help. I&apos;m an AI, not a therapist, and I&apos;ll always point you to real people if things get heavy.</p>
            <div className="mt-6 grid gap-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-2xl border border-border bg-surface px-4 py-3 text-left text-[14px] text-fg transition-colors hover:border-violet/40 hover:bg-violet-soft/40">{s}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) =>
            m.role === "USER" ? (
              <div key={m.id} className="flex justify-end gap-3">
                <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-ember px-4 py-3 text-[15px] leading-relaxed text-ember-fg"><p className="whitespace-pre-wrap">{m.content}</p></div>
                <Avatar user={me} size="sm" className="mt-1" />
              </div>
            ) : (
              <EmberBubble key={m.id} content={m.content} />
            )
          )
        )}
        {streaming !== null && <EmberBubble content={streaming || "…"} streaming />}
        {crisis && <CrisisResources compact title="Before we go on" intro="I'm glad you said it. If tonight feels unsafe, these humans are awake right now." />}
        <div ref={bottom} />
      </div>

      <div className="border-t border-border pt-3">
        <div className="flex items-end gap-2">
          <Textarea
            autoGrow
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, LIMITS.companion))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
              }
            }}
            placeholder="Say what's actually going on…"
            className="max-h-40 text-[15px]"
          />
          <Button size="icon" onClick={() => send(draft)} disabled={!draft.trim() || streaming !== null} aria-label="Send" className="mb-0.5 shrink-0"><Send /></Button>
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11.5px] text-fg-subtle"><Sparkles className="size-3" /> Ember can be wrong. In an emergency, call <a href="tel:14416" className="text-ember">14416</a> (India) or your local number — <Link href="/resources" className="text-ember hover:underline">all resources</Link>.</p>
      </div>
    </div>
  );
}
