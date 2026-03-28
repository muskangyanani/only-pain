"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type GuestPromptModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: string;
};

export function GuestPromptModal({
  open,
  onOpenChange,
  action = "do this",
}: GuestPromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Join OnlyPain</DialogTitle>
          <DialogDescription>
            Sign up to {action}. It&apos;s free.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button className="flex-1" asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
