"use client";
import { signOut } from "next-auth/react";
import { useEffect } from "react";
export default function Logout(){ useEffect(()=>{ signOut({ callbackUrl: "/" }); },[]); return <div className="p-6">Signing out…</div>; }
