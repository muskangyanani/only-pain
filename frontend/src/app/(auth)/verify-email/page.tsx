"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    async function verify() {
      const res = await api.get<{ message: string }>(
        `/api/auth/verify-email?token=${token}`
      );
      if (res.success) {
        setStatus("success");
        setMessage(res.data.message);
      } else {
        setStatus("error");
        setMessage(res.error);
      }
    }

    verify();
  }, [token]);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Email Verification
        </h1>
      </CardHeader>
      <CardContent className="text-center">
        {status === "loading" && (
          <p className="text-muted-foreground">Verifying your email...</p>
        )}
        {status === "success" && (
          <div className="space-y-4">
            <p className="text-foreground">{message}</p>
            <Button asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-4">
            <p className="text-destructive">{message}</p>
            <Button variant="outline" asChild>
              <Link href="/signup">Try again</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
