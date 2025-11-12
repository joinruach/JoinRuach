"use client";

import ScriptureLookup from "./ScriptureLookup";

export interface ScriptureListProps {
  references: string[];
  title?: string;
  variant?: "inline" | "badge" | "button";
  className?: string;
}

/**
 * ScriptureList - Display a list of scripture references
 *
 * Perfect for sermon notes, study guides, or related verses.
 *
 * Usage:
 * <ScriptureList
 *   title="Key Verses"
 *   references={["John 3:16", "Romans 8:28", "Philippians 4:13"]}
 *   variant="badge"
 * />
 */
export default function ScriptureList({
  references,
  title,
  variant = "badge",
  className = "",
}: ScriptureListProps) {
  if (!references || references.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
          <svg
            className="h-4 w-4 text-amber-600 dark:text-amber-400"
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
          {title}
        </h3>
      )}

      <div className="flex flex-wrap gap-2">
        {references.map((ref, index) => (
          <ScriptureLookup
            key={`${ref}-${index}`}
            reference={ref}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}
