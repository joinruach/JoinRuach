"use client";

import { useEffect, useState } from "react";
import LocalizedLink from "@/components/navigation/LocalizedLink";

export default function ConfirmedPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // params available but not used in this client component
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    console.log("[Email Confirmation Page] Query params:", { success, error });

    // The API route handles the actual confirmation
    // We just check the result via query params
    if (success === "true") {
      console.log("[Email Confirmation Page] Confirmation successful");
      setStatus("success");
    } else if (error) {
      console.error("[Email Confirmation Page] Confirmation failed:", error);
      setStatus("error");
    } else {
      // No success or error param - unexpected state
      console.warn("[Email Confirmation Page] No status params found, assuming error");
      setStatus("error");
    }
  }, []);

  if (status === "loading") {
    return (
      <main className="flex h-screen items-center justify-center bg-zinc-50 text-zinc-900 dark:bg-black dark:text-white">
        <p>Confirming your email...</p>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="flex h-screen items-center justify-center bg-zinc-50 text-zinc-900 dark:bg-black dark:text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-400">✅ Email Confirmed</h1>
          <p className="mt-2">You can now log in to your account.</p>
          <LocalizedLink href="/login">
            <span className="mt-4 inline-block rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600">
              Go to Login
            </span>
          </LocalizedLink>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen items-center justify-center bg-zinc-50 text-zinc-900 dark:bg-black dark:text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500">❌ Confirmation Failed</h1>
        <p className="mt-2">
          Your link may have expired. Please request a new one.
        </p>
        <LocalizedLink href="/login">
          <span className="mt-4 inline-block rounded border border-zinc-300 bg-white px-4 py-2 text-zinc-900 hover:bg-zinc-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
            Back to Login
          </span>
        </LocalizedLink>
      </div>
    </main>
  );
}
