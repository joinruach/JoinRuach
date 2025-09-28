"use client";
import { useState } from "react";
import { Button } from "./ui/Button";
import { track } from "@/lib/analytics";

export default function ResendButton({ email }:{ email: string }){
  const [ok,setOk]=useState<boolean|null>(null); const [loading,setLoading]=useState(false);
  async function resend(){ setLoading(true); setOk(null);
    const r = await fetch("/api/auth/resend-confirmation",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ email }) });
    if(r.ok) track("ResendConfirmation",{ email });
    setOk(r.ok); setLoading(false);
  }
  return (<div className="inline-flex items-center gap-2">
    <Button onClick={resend} disabled={loading} variant="white" size="sm">{loading?"Sending…":"Resend"}</Button>
    {ok===true&&<span className="text-xs text-green-700">Sent</span>}
    {ok===false&&<span className="text-xs text-red-600">Error</span>}
  </div>);
}
