"use client";
import { signOut } from "next-auth/react";
import { useEffect } from "react";
export default function Logout({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // params available but not used in this client component
  useEffect(()=>{ signOut({ callbackUrl: "/" }); },[]); return <div className="p-6">Signing out…</div>; }
