"use client";

import { useEffect, useState } from "react";
import { getScripture, trackScriptureEvent, type ScripturePassage } from "@/lib/scripture";

export interface ScriptureHighlightProps {
  reference: string;
  showReference?: boolean;
  className?: string;
  variant?: "card" | "quote" | "inline";
}

/**
 * ScriptureHighlight - Displays scripture text inline
 *
 * Fetches and displays the actual verse text (not just the reference).
 * Perfect for highlighting key verses in content.
 *
 * Usage:
 * <ScriptureHighlight
 *   reference="John 3:16"
 *   variant="card"
 *   showReference={true}
 * />
 */
export default function ScriptureHighlight({
  reference,
  showReference = true,
  className = "",
  variant = "card",
}: ScriptureHighlightProps) {
  const [passage, setPassage] = useState<ScripturePassage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!reference) return;

    const fetchPassage = async () => {
      setLoading(true);
      setError(false);

      try {
        const result = await getScripture(reference);

        if (result) {
          setPassage(result);
          trackScriptureEvent("view", reference);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPassage();
  }, [reference]);

  // Variant styles
  const variantClasses = {
    card: "rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm dark:border-amber-900/30 dark:from-amber-950/20 dark:to-neutral-900",
    quote: "border-l-4 border-amber-500 pl-4 italic",
    inline: "rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/20",
  };

  if (loading) {
    return (
      <div className={`${variantClasses[variant]} ${className}`}>
        <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
          <span className="text-sm">Loading scripture...</span>
        </div>
      </div>
    );
  }

  if (error || !passage || passage.verses.length === 0) {
    return (
      <div className={`${variantClasses[variant]} ${className}`}>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Could not load {reference}
        </p>
      </div>
    );
  }

  const verseText = passage.verses.map(v => v.text).join(" ");

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {/* Icon (card variant only) */}
      {variant === "card" && (
        <div className="mb-3 flex items-center gap-2">
          <svg
            className="h-5 w-5 text-amber-600 dark:text-amber-400"
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
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Scripture
          </span>
        </div>
      )}

      {/* Verse text */}
      <p className={`${variant === "card" ? "text-lg" : "text-base"} leading-relaxed text-neutral-800 dark:text-neutral-200`}>
        &ldquo;{verseText}&rdquo;
      </p>

      {/* Reference */}
      {showReference && (
        <p className="mt-3 text-right text-sm font-semibold text-amber-700 dark:text-amber-300">
          — {passage.reference}
        </p>
      )}
    </div>
  );
}
