"use client";

import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

const LoggedInDock = dynamic(() => import("./LoggedInDock"), {
  ssr: false,
  loading: () => null,
});

export default function LoggedInDockGate() {
  const { status } = useSession();

  if (status !== "authenticated") return null;

  return <LoggedInDock />;
}

