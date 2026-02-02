"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  minWords: number;
  placeholder?: string;
  className?: string;
};

function countWords(text: string): number {
  const normalized = text.trim();
  if (normalized.length === 0) return 0;

  const tokens = normalized.split(/\s+/);
  const HAS_WORD = /[\p{L}\p{N}]/u;
  const words = tokens.filter(token => token.length > 0 && HAS_WORD.test(token));

  return words.length;
}

export default function ReflectionTextarea({
  value,
  onChange,
  onBlur,
  minWords,
  placeholder = "Share your reflection...",
  className = "",
}: Props) {
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setWordCount(countWords(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Show saving indicator
    setIsSaving(true);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Simulate save with delay (actual save happens in parent)
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 500);
  };

  const progress = Math.min((wordCount / minWords) * 100, 100);
  const isComplete = wordCount >= minWords;

  return (
    <div className="space-y-3">
      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={8}
          className={`w-full rounded-xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-white/5 px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-white/40 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${className}`}
        />

        {/* Save Indicator */}
        {isSaving && (
          <div className="absolute top-3 right-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-white/60">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Saving...
          </div>
        )}

        {!isSaving && lastSaved && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Saved
          </div>
        )}
      </div>

      {/* Progress Bar & Word Count */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${
              isComplete
                ? "text-green-600 dark:text-green-400"
                : "text-zinc-600 dark:text-white/60"
            }`}>
              {wordCount} / {minWords} words
            </span>
            {isComplete && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Complete
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500 dark:text-white/50">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isComplete
                ? "bg-gradient-to-r from-green-400 to-green-500"
                : "bg-gradient-to-r from-amber-400 to-amber-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {!isComplete && (
          <p className="text-xs text-zinc-500 dark:text-white/50">
            {minWords - wordCount} more {minWords - wordCount === 1 ? "word" : "words"} needed
          </p>
        )}
      </div>
    </div>
  );
}
