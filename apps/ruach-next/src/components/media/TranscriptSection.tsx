// src/components/media/TranscriptSection.tsx
"use client";

import { useState } from "react";

type TranscriptSectionProps = {
  transcript: string;
};

export default function TranscriptSection({ transcript }: TranscriptSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left transition hover:bg-zinc-50 dark:hover:bg-white/5"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Transcript
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isOpen ? "Hide" : "View"} full text transcript
            </p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-zinc-600 transition-transform dark:text-zinc-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-zinc-200 p-6 dark:border-white/10">
          <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:text-zinc-900 dark:prose-headings:text-white prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-a:text-amber-600 dark:prose-a:text-amber-400">
            {transcript.split("\n\n").map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
