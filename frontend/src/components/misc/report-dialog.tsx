"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const REASONS = [
  { value: "SELF_HARM_RISK", label: "I'm worried about this person", hint: "They may be at risk of hurting themselves." },
  { value: "HARMFUL_CONTENT", label: "Harmful content", hint: "Methods, encouragement of self-harm, pro-ED content." },
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "HATE", label: "Hate or discrimination" },
  { value: "SPAM", label: "Spam or scam" },
  { value: "OTHER", label: "Something else" },
] as const;

export function ReportDialog({ open, onOpenChange, target }: { open: boolean; onOpenChange: (v: boolean) => void; target: { postId?: string; commentId?: string; userId?: string } }) {
  const [reason, setReason] = React.useState<(typeof REASONS)[number]["value"]>("SELF_HARM_RISK");
  const [details, setDetails] = React.useState("");
  const m = useMutation({
    mutationFn: () => api.post("/api/reports", { ...target, reason, details: details || null }),
    onSuccess: () => {
      toast("Thank you. A moderator will look at this.");
      onOpenChange(false);
      setDetails("");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report</DialogTitle>
          <DialogDescription>Reports are private. If someone might be in danger, choose the first option — we prioritise those.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          {REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setReason(r.value)}
              className={cn("flex w-full items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors", reason === r.value ? "border-ember bg-ember-soft" : "border-border hover:bg-surface")}
            >
              <span className={cn("mt-1 size-3.5 shrink-0 rounded-full border-2", reason === r.value ? "border-ember bg-ember" : "border-border-strong")} />
              <span>
                <span className="block text-sm font-medium text-fg">{r.label}</span>
                {"hint" in r && r.hint && <span className="block text-[12.5px] text-fg-muted">{r.hint}</span>}
              </span>
            </button>
          ))}
        </div>
        <Textarea className="mt-3" rows={2} placeholder="Anything else that helps? (optional)" value={details} onChange={(e) => setDetails(e.target.value.slice(0, 500))} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => m.mutate()} loading={m.isPending}>Send report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
