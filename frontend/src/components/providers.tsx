"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Tooltip } from "radix-ui";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api";
import { SocketBridge } from "@/hooks/use-socket";
import { ComposeProvider } from "@/components/post/compose-provider";
import { GuestGateProvider } from "@/components/misc/guest-gate";

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      },
      mutations: { retry: 0 },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(makeClient);
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={client}>
        <Tooltip.Provider delayDuration={300}>
          <GuestGateProvider>
            <ComposeProvider>
              {children}
              <SocketBridge />
              <Toaster position="bottom-center" richColors={false} toastOptions={{ className: "!rounded-2xl !border-border-strong !shadow-pop", duration: 3500 }} />
            </ComposeProvider>
          </GuestGateProvider>
        </Tooltip.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
