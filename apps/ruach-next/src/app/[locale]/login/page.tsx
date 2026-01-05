"use client";
import { signIn } from "next-auth/react";
import type { SignInResponse } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import { Button } from "@/components/ruach/ui/Button";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password. Please try again.",
  AccessDenied: "You do not have permission to sign in with those credentials.",
  SessionRequired: "Please sign in to continue.",
  OAuthCallback: "Unable to sign in with that provider right now. Please try again.",
  OAuthSignin: "Unable to sign in with that provider right now. Please try again.",
};

const getAuthErrorMessage = (code: string | null) => {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? "Invalid email or password. Please try again.";
};

function LoginForm() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmedMessage, setShowConfirmedMessage] = useState(false);
  const authErrorMessage = getAuthErrorMessage(searchParams.get("error"));

  useEffect(() => {
    // Check if user was redirected after email confirmation
    if (searchParams.get("confirmed") === "true") {
      setShowConfirmedMessage(true);
      // Hide message after 10 seconds
      setTimeout(() => setShowConfirmedMessage(false), 10000);
    }
  }, [searchParams]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return; // Prevent double-submit

    setErr(null);
    setLoading(true);

    try {
      // Use NextAuth's built-in redirect to ensure session is established
      // before navigating to the account page (fixes race condition)
      const res = (await signIn("credentials", {
        email,
        password,
        callbackUrl: `/${locale}/members/account`,
        redirect: true
      })) as SignInResponse | undefined;

      // If we reach here, there was an error (redirect: true doesn't return on success)
      if (res?.error) {
        setErr(res.error);
        setLoading(false);
      }
    } catch (error) {
      setErr("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Sign in</h1>
      {showConfirmedMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">
            <strong>✅ Email confirmed!</strong> Your account is now active. Please sign in below.
          </p>
        </div>
      )}
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full rounded border px-3 py-2 text-black"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <input
          className="w-full rounded border px-3 py-2 text-black"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        {(err || authErrorMessage) && (
          <p className="text-sm text-red-600">{err || authErrorMessage}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <Button
            as="a"
            href="/reset-password"
            variant="white"
            className="text-sm font-normal underline-offset-2 hover:underline"
          >
            Forgot password?
          </Button>
          <Button type="submit" variant="black" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>
        </div>
      </form>
      <p className="text-sm text-neutral-600">
        No account? <LocalizedLink href="/signup"><span className="text-amber-700 underline">Create one</span></LocalizedLink>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded w-24 ml-auto" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
