"use client";

import { useEffect, useState } from "react";
import Link from "next-intl/link";

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
    const token = params.get("confirmation");

    if (!token) {
      setStatus("error");
      return;
    }

    fetch(
      `https://api.joinruach.org/api/auth/email-confirmation?confirmation=${token}`
    )
      .then((res) => (res.ok ? setStatus("success") : setStatus("error")))
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return (
      <main className="flex h-screen items-center justify-center bg-black text-white">
        <p>Confirming your email...</p>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-400">✅ Email Confirmed</h1>
          <p className="mt-2">You can now log in to your account.</p>
          <Link href="/login">
            <span className="mt-4 inline-block rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600">
              Go to Login
            </span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500">❌ Confirmation Failed</h1>
        <p className="mt-2">
          Your link may have expired. Please request a new one.
        </p>
        <Link href="/login">
          <span className="mt-4 inline-block rounded bg-white/10 px-4 py-2 text-white hover:bg-white/20">
            Back to Login
          </span>
        </Link>
      </div>
    </main>
  );
}
