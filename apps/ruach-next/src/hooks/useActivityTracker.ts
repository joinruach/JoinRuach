"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"];
const ACTIVITY_THROTTLE = 60 * 1000; // Update every 1 minute

export function useActivityTracker() {
  const { data: session, update } = useSession();
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    if (!session) return;

    const handleActivity = () => {
      const now = Date.now();

      // Throttle updates to once per minute
      if (now - lastUpdateRef.current > ACTIVITY_THROTTLE) {
        lastUpdateRef.current = now;
        update(); // Triggers JWT callback with trigger="update"
      }
    };

    // Listen to user activity
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [session, update]);
}
