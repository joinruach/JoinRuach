"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResendButton from "@/components/ruach/ResendButton";

function CheckEmailContent(){
  const sp = useSearchParams();
  const email = sp.get("email") || "";
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p>
        We sent a confirmation link to: <strong>{email}</strong>
      </p>
      {email && <ResendButton email={email} />}
    </div>
  );
}

export default function CheckEmail(){
  return (
    <Suspense fallback={<div className="max-w-md space-y-4"><h1 className="text-2xl font-bold">Check your email</h1><p>Loading your email address…</p></div>}>
      <CheckEmailContent />
    </Suspense>
  );
}
