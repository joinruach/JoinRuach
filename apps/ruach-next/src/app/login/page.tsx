"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ruach/ui/Button";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmedMessage, setShowConfirmedMessage] = useState(false);

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
      const res = await signIn("credentials", { email, password, redirect: false });

      if (!res || res?.error) {
        setErr(res?.error || "Login failed");
        setLoading(false);
      } else {
        // Keep loading state while redirecting
        window.location.href = res?.url || "/";
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
        {err && <p className="text-sm text-red-600">{err}</p>}
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
        No account? <a href="/signup" className="text-amber-700 underline">Create one</a>
      </p>
    </div>
  );
}
