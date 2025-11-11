import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];
const ACTIVITY_THROTTLE = 60 * 1000; // Update every 1 minute

export interface UseActivityTrackerOptions {
  /**
   * Callback when activity is detected
   */
  onActivity?: () => void;

  /**
   * Throttle time in milliseconds (default: 60000)
   */
  throttle?: number;

  /**
   * Custom events to listen for
   */
  events?: string[];

  /**
   * Whether tracking is enabled (default: true)
   */
  enabled?: boolean;
}

/**
 * Track user activity and trigger callback on activity
 * Useful for session management, analytics, and idle detection
 */
export function useActivityTracker(options: UseActivityTrackerOptions = {}) {
  const {
    onActivity,
    throttle = ACTIVITY_THROTTLE,
    events = ACTIVITY_EVENTS,
    enabled = true,
  } = options;

  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    if (!enabled || !onActivity) return;

    const handleActivity = () => {
      const now = Date.now();

      // Throttle updates
      if (now - lastUpdateRef.current > throttle) {
        lastUpdateRef.current = now;
        onActivity();
      }
    };

    // Listen to user activity
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, onActivity, throttle, events]);
}
