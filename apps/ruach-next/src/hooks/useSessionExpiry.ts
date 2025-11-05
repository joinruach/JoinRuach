"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@ruach/components/components/ruach/toast/useToast";

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

export function useSessionExpiry() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [warningShown, setWarningShown] = useState(false);

  useEffect(() => {
    if (!session || !session.lastActivity) return;

    const checkExpiry = () => {
      const lastActivity = session.lastActivity as number;
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const timeUntilExpiry = IDLE_TIMEOUT - timeSinceActivity;

      // Show warning 5 minutes before expiry
      if (timeUntilExpiry <= WARNING_THRESHOLD && timeUntilExpiry > 0 && !warningShown) {
        const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
        toast({
          title: "Session Expiring Soon",
          description: `Your session will expire in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""} due to inactivity.`,
          variant: "default",
        });
        setWarningShown(true);
      }

      // Reset warning when user becomes active again
      if (timeUntilExpiry > WARNING_THRESHOLD && warningShown) {
        setWarningShown(false);
      }
    };

    const interval = setInterval(checkExpiry, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [session, toast, warningShown]);
}
