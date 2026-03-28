"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function CrisisBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="text-foreground">
        You&apos;re not alone. If you&apos;re in crisis, please reach out.
      </p>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p>iCall India: <span className="text-foreground">9152987821</span></p>
        <p>Vandrevala Foundation: <span className="text-foreground">1860-2662-345</span></p>
      </div>
    </div>
  );
}
