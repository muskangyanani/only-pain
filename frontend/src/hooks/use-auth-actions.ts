"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Me } from "@/lib/types";
import { disconnectSocket } from "@/hooks/use-socket";

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { identifier: string; password: string }) => api.post<Me>("/api/auth/login", input),
    onSuccess: (me) => {
      qc.clear();
      qc.setQueryData(qk.me, me);
    },
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { username: string; email: string; password: string; displayName?: string }) => api.post<Me>("/api/auth/signup", input),
    onSuccess: (me) => {
      qc.clear();
      qc.setQueryData(qk.me, me);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => api.post("/api/auth/logout"),
    onSettled: () => {
      disconnectSocket();
      qc.clear();
      qc.setQueryData(qk.me, null);
      router.push("/");
      router.refresh();
    },
  });
}
