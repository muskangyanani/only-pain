"use client";

import * as React from "react";

/** Current time as state (ticks every `everyMs`), so render stays pure and relative times refresh. */
export function useNow(everyMs = 60_000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

/** Latest-value ref that is only written inside an effect (React Compiler friendly). */
export function useLatest<T>(value: T) {
  const ref = React.useRef(value);
  React.useEffect(() => {
    ref.current = value;
  });
  return ref;
}

/** Read a localStorage key with SSR safety and cross-tab updates. */
export function useStoredValue(key: string) {
  const subscribe = React.useCallback(
    (cb: () => void) => {
      const onStorage = (e: StorageEvent) => e.key === key && cb();
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
    [key]
  );
  return React.useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null
  );
}
