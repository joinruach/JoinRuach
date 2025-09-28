"use client";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function ProfileMenu() {
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  if (!data) return null;

  return (
    <div className="relative">
      <button onClick={()=>setOpen(o=>!o)} className="rounded-full bg-white/10 px-3 py-1 text-white">{data.user?.name ?? "Profile"}</button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white p-2 text-sm shadow-lg">
          <a href="/account" className="block rounded px-2 py-1 hover:bg-neutral-100">Account</a>
          <a href="/courses" className="block rounded px-2 py-1 hover:bg-neutral-100">My Courses</a>
          <button onClick={()=>signOut({ callbackUrl:"/" })} className="mt-1 w-full rounded px-2 py-1 text-left hover:bg-neutral-100">Logout</button>
        </div>
      )}
    </div>
  );
}
