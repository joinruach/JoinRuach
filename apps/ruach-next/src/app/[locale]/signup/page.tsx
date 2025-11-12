"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ruach/ui/Button";
import { track } from "@/lib/analytics";

export default function SignupPage(){
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
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Create your Ruach account</h1>
        <p className="text-sm text-white/70">Join the Ruach community to access teaching, outreach resources, and media from anywhere.</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-xs uppercase tracking-wide text-white/60">Email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            onFocus={()=>track("SignupStart")}
            className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-amber-400 focus:outline-none"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-xs uppercase tracking-wide text-white/60">Password</label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-amber-400 focus:outline-none"
            placeholder="Create a password"
            required
          />
          <p className="text-xs text-white/50">Must be at least 8 characters.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="signup-confirm" className="text-xs uppercase tracking-wide text-white/60">Confirm password</label>
          <input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={e=>setConfirm(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-amber-400 focus:outline-none"
            placeholder="Repeat your password"
            required
          />
        </div>
        {error ? (
          <p className="rounded-full border border-amber-300/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">{error}</p>
        ) : null}
        <Button type="submit" variant="gold" className="w-full rounded-full text-black" disabled={status==="loading"}>
          {status==="loading"?"Creating account…":"Create account"}
        </Button>
      </form>
      <p className="text-sm text-white/70">Already registered? <a className="text-amber-300 underline" href="/login">Sign in</a></p>
    </div>
  );
}
