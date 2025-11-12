"use client";

import { useEffect, useState } from "react";

export interface CountdownTimerProps {
  targetDate: Date | string;
  onComplete?: () => void;
  className?: string;
  showLabels?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

/**
 * CountdownTimer - Displays a countdown to a specific date/time
 *
 * Usage:
 * <CountdownTimer
 *   targetDate="2025-12-25T10:00:00Z"
 *   onComplete={() => console.log('Stream started!')}
 * />
 */
export default function CountdownTimer({
  targetDate,
  onComplete,
  className = "",
  showLabels = true,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const calculateTimeLeft = (): TimeLeft => {
      const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference,
      };
    };

    // Initial calculation
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // Call onComplete when countdown reaches zero
      if (newTimeLeft.total === 0 && onComplete) {
        onComplete();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (!mounted) {
    return (
      <div className={`flex items-center gap-2 ${className}`} aria-hidden="true">
        <div className="h-16 w-16 rounded-lg bg-white/10" />
        <div className="h-16 w-16 rounded-lg bg-white/10" />
        <div className="h-16 w-16 rounded-lg bg-white/10" />
        <div className="h-16 w-16 rounded-lg bg-white/10" />
      </div>
    );
  }

  // If countdown is complete
  if (timeLeft.total === 0) {
    return (
      <div
        className={`text-center ${className}`}
        role="timer"
        aria-live="polite"
        aria-label="Stream has started"
      >
        <div className="text-2xl font-bold text-amber-500 dark:text-amber-400">
          Stream is Live Now!
        </div>
      </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: "Days", shortLabel: "D" },
    { value: timeLeft.hours, label: "Hours", shortLabel: "H" },
    { value: timeLeft.minutes, label: "Minutes", shortLabel: "M" },
    { value: timeLeft.seconds, label: "Seconds", shortLabel: "S" },
  ];

  return (
    <div
      className={`flex items-center justify-center gap-2 sm:gap-3 ${className}`}
      role="timer"
      aria-live="polite"
      aria-label={`Stream starts in ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}
    >
      {timeUnits.map((unit, index) => (
        <div key={unit.label} className="flex flex-col items-center">
          <div className="flex min-w-[60px] flex-col items-center justify-center rounded-lg bg-white/10 p-3 backdrop-blur-sm dark:bg-white/5 sm:min-w-[70px] sm:p-4">
            <div className="text-2xl font-bold tabular-nums text-neutral-900 dark:text-white sm:text-3xl">
              {String(unit.value).padStart(2, "0")}
            </div>
            {showLabels && (
              <div className="mt-1 text-xs uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                {unit.label}
              </div>
            )}
          </div>
          {/* Separator colon between units (except after last one) */}
          {index < timeUnits.length - 1 && (
            <div
              className="mx-1 text-xl font-bold text-neutral-400 dark:text-neutral-600"
              aria-hidden="true"
            >
              :
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
