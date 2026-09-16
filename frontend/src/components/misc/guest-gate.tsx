"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/hooks/use-me";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmberMark } from "@/components/brand/wordmark";

type Gate = (action: string, fn: () => void) => void;
const Ctx = React.createContext<Gate>(() => {});

export function GuestGateProvider({ children }: { children: React.ReactNode }) {
  const { isAuthed } = useMe();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [action, setAction] = React.useState("do that");
  const gate = React.useCallback<Gate>(
    (a, fn) => {
      if (isAuthed) fn();
      else {
        setAction(a);
        setOpen(true);
      }
    },
    [isAuthed]
  );
  return (
    <Ctx.Provider value={gate}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-ember-soft">
            <EmberMark size={26} />
          </div>
          <DialogHeader>
            <DialogTitle>Join to {action}</DialogTitle>
            <DialogDescription>It&apos;s free, takes a minute, and you can stay anonymous in everything you post.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href={`/signup?next=${encodeURIComponent(pathname)}`}>Create account</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Log in</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

export const useGuestGate = () => React.useContext(Ctx);
