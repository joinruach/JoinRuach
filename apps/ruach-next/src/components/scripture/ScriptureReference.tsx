"use client";

import { useState } from "react";
import { parseScriptureReference, formatScriptureReference } from "@/lib/scripture";

export interface ScriptureReferenceProps {
  reference: string;
  onClick?: () => void;
  className?: string;
  variant?: "inline" | "badge" | "button";
}

/**
 * ScriptureReference - Clickable scripture reference
 *
 * Usage:
 * <ScriptureReference
 *   reference="John 3:16"
 *   onClick={() => openModal("John 3:16")}
 *   variant="inline"
 * />
 */
export default function ScriptureReference({
  reference,
  onClick,
  className = "",
  variant = "inline",
}: ScriptureReferenceProps) {
  const [isHovered, setIsHovered] = useState(false);

  const parsed = parseScriptureReference(reference);
  if (!parsed) return <span className={className}>{reference}</span>;

  const formatted = formatScriptureReference(parsed);

  // Variant styles
  const variantClasses = {
    inline: "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 underline decoration-dotted underline-offset-2 cursor-pointer transition-colors",
    badge: "inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30 cursor-pointer transition-colors",
    button: "inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300 cursor-pointer transition-colors shadow-sm",
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <span
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${variantClasses[variant]} ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`View scripture: ${formatted}`}
    >
      {variant === "badge" || variant === "button" ? (
        <>
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          {formatted}
        </>
      ) : (
        formatted
      )}
    </span>
  );
}
