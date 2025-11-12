"use client";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@ruach/components/components/ruach/toast/ToastProvider";
import { SessionChecker } from "@/components/SessionChecker";

export default function Providers({ children }:{ children: React.ReactNode }){
  return (
    <SessionProvider>
      <ToastProvider>
        <SessionChecker />
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}
