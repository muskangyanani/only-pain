"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function SettingsRedirect() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace(`/profile/${user.username}`);
    } else {
      router.replace("/login");
    }
  }, [user, router]);

  return null;
}
