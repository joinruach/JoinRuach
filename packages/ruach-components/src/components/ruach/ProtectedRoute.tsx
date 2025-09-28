"use client";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function ProtectedRoute({ children }:{ children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  if (status === "loading") return <div className="p-6 text-neutral-600">Checking access…</div>;
  if (status === "unauthenticated") {
    const next = encodeURIComponent(pathname || "/");
    return (
      <div className="p-6 text-center">
        <p className="text-neutral-700">Please <Link href={`/login?next=${next}`} className="text-amber-600 underline">sign in</Link> to view this content.</p>
      </div>
    );
  }
  return <>{children}</>;
}
