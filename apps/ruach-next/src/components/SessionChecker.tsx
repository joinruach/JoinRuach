"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@ruach/components/components/ruach/toast/useToast";
import { useSessionExpiry } from "@/hooks/useSessionExpiry";
import { useActivityTracker } from "@/hooks/useActivityTracker";

export function SessionChecker() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Track session expiry and show warnings
  useSessionExpiry();

  // Track user activity
  useActivityTracker();

  useEffect(() => {
    // Handle session errors
    if (session?.error === "IdleTimeout") {
      toast({
        title: "Session Expired",
        description: "Your session expired due to 30 minutes of inactivity. Please log in again.",
        variant: "error",
      });
      signOut({ callbackUrl: "/login?expired=idle" });
    } else if (session?.error === "RefreshAccessTokenError") {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "error",
      });
      signOut({ callbackUrl: "/login?expired=true" });
    }
  }, [session, toast]);

  useEffect(() => {
    // Show message if user was redirected after expiry
    const expired = searchParams.get("expired");
    if (expired === "idle") {
      toast({
        title: "Session Expired",
        description: "Your session expired due to inactivity. Please log in again.",
        variant: "default",
      });
    } else if (expired === "true") {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "default",
      });
    }
  }, [searchParams, toast]);

  return null;
}
