"use client";
import { useSearchParams } from "next/navigation";
import ResendButton from "@/components/ruach/ResendButton";

export default function CheckEmail(){
  const sp = useSearchParams();
  const email = sp.get("email") || "";
  return (<div className="space-y-4 max-w-md">
    <h1 className="text-2xl font-bold">Check your email</h1>
    <p>We sent a confirmation link to: <strong>{email}</strong></p>
    {email && <ResendButton email={email} />}
  </div>);
}
