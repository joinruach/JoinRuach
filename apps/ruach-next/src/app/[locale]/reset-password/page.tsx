"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import { Button } from "@/components/ruach/ui/Button";

const SUCCESS_MESSAGE =
  "If an account exists for that email, you\u2019ll receive a password reset link shortly.";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Unable to send reset link.");
      } else {
        setMessage(
          typeof data?.message === "string" ? data.message : SUCCESS_MESSAGE
        );
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="text-sm text-neutral-600">
        Enter the email associated with your account. We{"'"}ll send you a link to reset your
        password.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full rounded border px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <Button type="submit" variant="black" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <p className="text-sm text-neutral-600">
        Remembered your password?{" "}
        <LocalizedLink href="/login">
          <span className="text-amber-700 underline">Return to login</span>
        </LocalizedLink>
      </p>
    </div>
  );
}

function ResetPasswordForm({ code }: { code: string }) {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      setSuccess(false);
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password, passwordConfirmation }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Unable to reset password.");
        setSuccess(false);
      } else {
        setSuccess(true);
        setPassword("");
        setPasswordConfirmation("");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <p className="text-sm text-neutral-600">
        Enter a new password below to finish resetting your account.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full rounded border px-3 py-2"
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="w-full rounded border px-3 py-2"
          type="password"
          placeholder="Confirm new password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">
            Password updated! You can now log in with your new credentials.
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="black" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
          {success && (
            <Button as="a" href="/login" variant="white">
              Return to login
            </Button>
          )}
        </div>
      </form>
      <p className="text-sm text-neutral-600">
        Link expired or not working?{" "}
        <LocalizedLink href="/reset-password">
          <span className="text-amber-700 underline">Request a new reset email</span>
        </LocalizedLink>
      </p>
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  return code ? <ResetPasswordForm code={code} /> : <ForgotPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p>Loading...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
