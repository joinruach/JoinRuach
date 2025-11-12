"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  shouldNotifyUser,
  dismissNotification,
  formatTimeRemaining,
  getTimeUntilStart,
} from "@/lib/livestream";

export interface StreamNotificationProps {
  streamId: string | number;
  title: string;
  scheduledStart: Date | string;
  streamUrl: string;
  notificationWindowMinutes?: number;
}

/**
 * StreamNotification - Shows a notification banner for upcoming livestreams
 *
 * Displays when:
 * - Stream is within notification window (default 30 minutes)
 * - User hasn't dismissed the notification
 *
 * Usage:
 * <StreamNotification
 *   streamId={123}
 *   title="Sunday Service"
 *   scheduledStart="2025-12-25T10:00:00Z"
 *   streamUrl="/live/sunday-service"
 *   notificationWindowMinutes={30}
 * />
 */
export default function StreamNotification({
  streamId,
  title,
  scheduledStart,
  streamUrl,
  notificationWindowMinutes = 30,
}: StreamNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    // Check if should show notification
    const shouldShow = shouldNotifyUser(scheduledStart, notificationWindowMinutes, streamId.toString());
    setVisible(shouldShow);

    if (!shouldShow) return;

    // Update time remaining every second
    const updateTime = () => {
      const timeUntil = getTimeUntilStart(scheduledStart);
      setTimeRemaining(formatTimeRemaining(timeUntil));

      // Hide when stream starts
      if (timeUntil <= 0) {
        setVisible(false);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [streamId, scheduledStart, notificationWindowMinutes]);

  const handleDismiss = () => {
    dismissNotification(streamId);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <div className="overflow-hidden rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-500 to-amber-600 p-4 shadow-xl">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-white">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/90">
              Livestream Starting Soon
            </div>
            <h3 className="mb-1 font-bold">{title}</h3>
            <p className="text-sm text-white/90">Starts in {timeRemaining}</p>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              <Link
                href={streamUrl}
                className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-amber-600 transition-colors hover:bg-white/90"
              >
                Join Stream
              </Link>
              <button
                onClick={handleDismiss}
                className="text-sm font-medium text-white/80 underline transition-colors hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/70 transition-colors hover:text-white"
            aria-label="Close notification"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
