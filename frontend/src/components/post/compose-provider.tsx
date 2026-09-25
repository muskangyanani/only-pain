"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "radix-ui";
import { PostComposer } from "./post-composer";
import { useGuestGate } from "@/components/misc/guest-gate";

type Opts = { circle?: { id: string; name: string; icon: string } | null };
const Ctx = React.createContext<{ open: (opts?: Opts) => void; close: () => void }>({ open: () => {}, close: () => {} });

export function ComposeProvider({ children }: { children: React.ReactNode }) {
  const gate = useGuestGate();
  const [state, setState] = React.useState<{ open: boolean; opts: Opts }>({ open: false, opts: {} });
  const value = React.useMemo(
    () => ({
      open: (opts: Opts = {}) => gate("post", () => setState({ open: true, opts })),
      close: () => setState((s) => ({ ...s, open: false })),
    }),
    [gate]
  );
  return (
    <Ctx.Provider value={value}>
      {children}
      <Dialog open={state.open} onOpenChange={(o) => setState((s) => ({ ...s, open: o }))}>
        <DialogContent size="lg" className="p-4 sm:p-5">
          <VisuallyHidden.Root>
            <DialogTitle>New post</DialogTitle>
          </VisuallyHidden.Root>
          <PostComposer variant="dialog" autoFocus circle={state.opts.circle ?? null} onPosted={value.close} className="pr-6" />
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

export const useCompose = () => React.useContext(Ctx);
