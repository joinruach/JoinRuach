import { useEffect, useState, useCallback } from 'react';

export interface UseSessionExpiryOptions {
  /**
   * Session expiry time in milliseconds
   */
  expiryTime: number;

  /**
   * Warning time before expiry in milliseconds
   */
  warningTime?: number;

  /**
   * Callback when session expires
   */
  onExpire?: () => void;

  /**
   * Callback when warning threshold is reached
   */
  onWarning?: (timeRemaining: number) => void;

  /**
   * Whether session tracking is enabled
   */
  enabled?: boolean;
}

/**
 * Track session expiry and provide warnings
 */
export function useSessionExpiry(options: UseSessionExpiryOptions) {
  const {
    expiryTime,
    warningTime = 5 * 60 * 1000, // 5 minutes default
    onExpire,
    onWarning,
    enabled = true,
  } = options;

  const [timeRemaining, setTimeRemaining] = useState(expiryTime);
  const [isExpired, setIsExpired] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const reset = useCallback(() => {
    setTimeRemaining(expiryTime);
    setIsExpired(false);
    setShowWarning(false);
  }, [expiryTime]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1000;

        // Check expiry
        if (newTime <= 0) {
          setIsExpired(true);
          onExpire?.();
          return 0;
        }

        // Check warning threshold
        if (newTime <= warningTime && !showWarning) {
          setShowWarning(true);
          onWarning?.(newTime);
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, warningTime, showWarning, onExpire, onWarning]);

  return {
    timeRemaining,
    isExpired,
    showWarning,
    reset,
    minutesRemaining: Math.floor(timeRemaining / 60000),
    secondsRemaining: Math.floor((timeRemaining % 60000) / 1000),
  };
}
