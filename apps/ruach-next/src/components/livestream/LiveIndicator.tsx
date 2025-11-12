"use client";

export interface LiveIndicatorProps {
  isLive?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  pulse?: boolean;
  className?: string;
}

/**
 * LiveIndicator - Shows a pulsing "LIVE" badge
 *
 * Usage:
 * <LiveIndicator isLive={true} size="md" showLabel={true} />
 */
export default function LiveIndicator({
  isLive = false,
  size = "md",
  showLabel = true,
  pulse = true,
  className = "",
}: LiveIndicatorProps) {
  if (!isLive) return null;

  // Size variants
  const sizeClasses = {
    sm: {
      container: "px-2 py-0.5 text-xs",
      dot: "h-1.5 w-1.5",
      gap: "gap-1",
    },
    md: {
      container: "px-2.5 py-1 text-sm",
      dot: "h-2 w-2",
      gap: "gap-1.5",
    },
    lg: {
      container: "px-3 py-1.5 text-base",
      dot: "h-2.5 w-2.5",
      gap: "gap-2",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center ${sizes.gap} ${sizes.container} rounded-full bg-red-500 font-bold uppercase tracking-wide text-white shadow-lg ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Live now"
    >
      {/* Pulsing dot */}
      <span className="relative flex items-center justify-center">
        <span
          className={`${sizes.dot} rounded-full bg-white ${
            pulse ? "animate-ping absolute" : ""
          }`}
          aria-hidden="true"
        />
        <span
          className={`${sizes.dot} relative rounded-full bg-white`}
          aria-hidden="true"
        />
      </span>

      {/* LIVE label */}
      {showLabel && <span>Live</span>}
    </div>
  );
}
