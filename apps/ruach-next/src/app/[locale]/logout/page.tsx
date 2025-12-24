"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { useLocale } from "next-intl";

export default function Logout() {
  const locale = useLocale();

  useEffect(() => {
    signOut({ callbackUrl: `/${locale}` });
  }, [locale]);

  return <div className="p-6">Signing out…</div>;
}
