"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ruach/ui/Button";

export default function LoginPage(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [err,setErr]=useState<string|null>(null);
  async function submit(e:React.FormEvent){e.preventDefault(); setErr(null);
    const res = await signIn("credentials",{ email,password, redirect:false });
    if (!res || res?.error) setErr(res?.error || "Login failed"); else window.location.href = res?.url || "/";
  }
  return (<div className="max-w-md space-y-4">
    <h1 className="text-2xl font-bold">Sign in</h1>
    <form onSubmit={submit} className="space-y-3">
      <input className="w-full rounded border px-3 py-2 text-black" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <input className="w-full rounded border px-3 py-2 text-black" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex items-center justify-between gap-3">
        <Button type="submit" variant="black">Login</Button>
        <Button
          as="a"
          href="/reset-password"
          variant="white"
          className="text-sm font-normal underline-offset-2 hover:underline"
        >
          Forgot password?
        </Button>
      </div>
    </form>
    <p className="text-sm text-neutral-600">No account? <a href="/signup" className="text-amber-700 underline">Create one</a></p>
  </div>);
}
