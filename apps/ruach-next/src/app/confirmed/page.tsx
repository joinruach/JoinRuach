"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ruach/ui/Button";

function ConfirmedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const confirmation = searchParams.get("confirmation");

    if (!confirmation) {
      setStatus("error");
      setMessage("No confirmation code provided.");
      return;
    }

    // Call Strapi's confirmation endpoint
    const confirmEmail = async () => {
      try {
        const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
        const response = await fetch(
          `${strapiUrl}/api/auth/email-confirmation?confirmation=${confirmation}`
        );

        if (response.ok) {
          setStatus("success");
          setMessage("Your email has been confirmed! You can now sign in.");
        } else {
          const error = await response.json().catch(() => ({}));
          setStatus("error");
          setMessage(
            error?.error?.message ||
            error?.message ||
            "Confirmation failed. The link may have expired or already been used."
          );
        }
      } catch (err) {
        setStatus("error");
        setMessage("Network error. Please try again later.");
      }
    };

    confirmEmail();
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto space-y-6 p-6">
      {status === "loading" && (
        <>
          <h1 className="text-2xl font-bold">Confirming your email...</h1>
          <p className="text-gray-600">Please wait while we verify your account.</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <h1 className="text-2xl font-bold text-green-900 mb-2">✓ Email Confirmed!</h1>
            <p className="text-green-800">{message}</p>
          </div>
          <Button
            onClick={() => router.push("/login")}
            variant="gold"
            className="w-full"
          >
            Go to Sign In
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <h1 className="text-2xl font-bold text-red-900 mb-2">✗ Confirmation Failed</h1>
            <p className="text-red-800">{message}</p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => router.push("/check-email")}
              variant="white"
              className="w-full"
            >
              Resend Confirmation Email
            </Button>
            <Button
              onClick={() => router.push("/signup")}
              variant="white"
              className="w-full"
            >
              Back to Sign Up
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto space-y-6 p-6">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      }
    >
      <ConfirmedContent />
    </Suspense>
  );
}
