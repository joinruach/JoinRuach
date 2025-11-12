"use client";

import { useState } from "react";
import Image from "next/image";
import CountdownTimer from "./CountdownTimer";

export interface UpcomingStreamProps {
  title: string;
  description?: string;
  scheduledTime: Date | string;
  thumbnail?: string;
  onStreamStart?: () => void;
  className?: string;
}

/**
 * UpcomingStream - Shows upcoming livestream with countdown
 *
 * Usage:
 * <UpcomingStream
 *   title="Sunday Service"
 *   description="Join us for worship and the Word"
 *   scheduledTime="2025-12-25T10:00:00Z"
 *   thumbnail="/images/stream-thumb.jpg"
 * />
 */
export default function UpcomingStream({
  title,
  description,
  scheduledTime,
  thumbnail,
  onStreamStart,
  className = "",
}: UpcomingStreamProps) {
  const [hasStarted, setHasStarted] = useState(false);

  const handleComplete = () => {
    setHasStarted(true);
    if (onStreamStart) {
      onStreamStart();
    }
  };

  const scheduledDate = typeof scheduledTime === "string" ? new Date(scheduledTime) : scheduledTime;
  const formattedDate = scheduledDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div
      className={`overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-amber-50 to-white p-8 dark:border-white/10 dark:from-neutral-900 dark:to-neutral-950 ${className}`}
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        {/* Left: Stream info and countdown */}
        <div className="space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
            <svg
              className="h-4 w-4"
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
            Upcoming Livestream
          </div>

          {/* Title */}
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-neutral-700 dark:text-neutral-300">
                {description}
              </p>
            )}
          </div>

          {/* Date and time */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">{formattedTime}</span>
            </div>
          </div>

          {/* Countdown */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              Starting In
            </h3>
            <CountdownTimer
              targetDate={scheduledTime}
              onComplete={handleComplete}
            />
          </div>

          {/* Action buttons */}
          {hasStarted && (
            <div className="pt-4">
              <button className="rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600">
                Watch Live Now
              </button>
            </div>
          )}
        </div>

        {/* Right: Thumbnail */}
        {thumbnail && (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800">
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover"
            />
            {/* Play icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-transform hover:scale-110">
                <svg
                  className="h-8 w-8 translate-x-0.5 text-neutral-900"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
