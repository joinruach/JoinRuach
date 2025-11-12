"use client";

import { formatLikeCount } from "@/lib/likes";

export interface LikeCountProps {
  count: number;
  showIcon?: boolean;
  className?: string;
}

/**
 * Display-only like count component
 * Use this for lists/grids where you want to show like counts without interaction
 */
export default function LikeCount({
  count,
  showIcon = true,
  className = "",
}: LikeCountProps) {
  if (count === 0) return null;

  return (
    <div
      className={`flex items-center gap-1.5 text-rose-500 dark:text-rose-400 ${className}`}
      aria-label={`${count} likes`}
    >
      {showIcon && (
        <svg
          className="h-4 w-4 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
      <span className="text-sm font-medium tabular-nums">
        {formatLikeCount(count)}
      </span>
    </div>
  );
}
