"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import { Button } from "@/components/ruach/ui/Button";
import { track } from "@/lib/analytics";

// Signup page must be dynamic (uses router and form state)
export const dynamic = "force-dynamic";

export default function SignupPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // params available but not used in this client component
  const router = useRouter();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [confirm,setConfirm] = useState("");
  const [error,setError] = useState<string|null>(null);
  const [status,setStatus] = useState<"idle"|"loading">("idle");

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const emailTrimmed = email.trim();
    if (!emailTrimmed){
      setError("Email is required.");
      return;
    }
    if (password.length < 8){
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm){
      setError("Passwords do not match.");
      return;
    }

    setStatus("loading");
    setError(null);
    track("SignupSubmit",{ email: emailTrimmed });

    try {
      const res = await fetch("/api/auth/signup",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ email: emailTrimmed, password, username: emailTrimmed })
      });
      const json = await res.json().catch(()=>({}));
      if (!res.ok){
        const message = json?.error || "Unable to create account.";
        throw new Error(message);
      }
      router.push(`/check-email?email=${encodeURIComponent(emailTrimmed)}`);
    } catch (err:any){
      setError(err?.message || "Something went wrong.");
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-3xl border border-border bg-card p-8 text-foreground shadow-[0_20px_60px_rgba(43,37,30,0.08)]">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Create your Ruach account</h1>
        <p className="text-sm text-muted-foreground">Join the Ruach community to access teaching, outreach resources, and media from anywhere.</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-xs uppercase tracking-wide text-muted-foreground">Email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            onFocus={()=>track("SignupStart")}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-xs uppercase tracking-wide text-muted-foreground">Password</label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            placeholder="Create a password"
            required
          />
          <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="signup-confirm" className="text-xs uppercase tracking-wide text-muted-foreground">Confirm password</label>
          <input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={e=>setConfirm(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            placeholder="Repeat your password"
            required
          />
        </div>
        {error ? (
          <p className="rounded-full border border-[rgba(200,169,126,0.4)] bg-[rgba(212,181,138,0.15)] px-4 py-2 text-sm text-foreground">{error}</p>
        ) : null}
        <Button type="submit" variant="gold" className="w-full rounded-full" disabled={status==="loading"}>
          {status==="loading"?"Creating account…":"Create account"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">Already registered? <LocalizedLink href="/login"><span className="text-foreground underline decoration-[hsl(var(--primary))] decoration-2 underline-offset-4">Sign in</span></LocalizedLink></p>
    </div>
  );
}
