"use client";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@ruach/components/components/ruach/toast/ToastProvider";
import { SessionChecker } from "@/components/SessionChecker";
import { MediaPlayerProvider } from "@/contexts/MediaPlayerContext";

export default function Providers({ children }:{ children: React.ReactNode }){
  return (
    <SessionProvider>
      <ToastProvider>
        <MediaPlayerProvider>
          <SessionChecker />
          {children}
        </MediaPlayerProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
