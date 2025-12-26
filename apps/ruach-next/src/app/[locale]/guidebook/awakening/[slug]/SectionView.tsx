"use client";

import { use, useEffect, useState } from "react";
import { useActionState } from "react";
import { FormationSection, Checkpoint } from "@ruach/formation";
import { submitCheckpoint } from "./actions";
import { Prose } from "@/components/Prose";

interface SectionViewProps {
  locale: string;
  section: FormationSection;
  checkpoint: Checkpoint;
}

interface FormState {
  ok: boolean;
  message?: string;
  redirectTo?: string;
}

const initialState: FormState = { ok: false };

export function SectionView({ locale, section, checkpoint }: SectionViewProps) {
  const [dwellStartTime] = useState(() => Date.now());
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [state, action, pending] = useActionState(submitCheckpoint, initialState);

  // Track section view on mount
  useEffect(() => {
    // Emit SectionViewedEvent (placeholder for now)
    console.log("[Formation Event] SectionViewed", {
      sectionId: section.id,
      phase: section.phase,
      timestamp: new Date().toISOString(),
    });
  }, [section.id, section.phase]);

  // Calculate minimum wait time for checkpoint
  const minimumWaitMs = checkpoint.minimumDwellSeconds * 1000;

  // Check if minimum dwell time has passed
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCheckpoint(true);
    }, minimumWaitMs);

    return () => clearTimeout(timer);
  }, [minimumWaitMs]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Section Header */}
        <header className="mb-12">
          <div className="mb-4 text-sm font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Phase 1: Awakening · Section {section.order}
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
            {section.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            <span>{section.estimatedReadingMinutes} min read</span>
            <span>•</span>
            <span>{section.scriptureAnchors.length} Scripture references</span>
          </div>
        </header>

        {/* Section Content (Markdown) */}
        <article className="prose prose-neutral mx-auto mb-16 dark:prose-invert">
          <Prose content={section.content} />
        </article>

        {/* Checkpoint */}
        <section className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-8 dark:border-amber-900/30 dark:bg-amber-950/20">
          {!showCheckpoint ? (
            // Waiting State
            <div className="text-center">
              <div className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
                Formation Checkpoint
              </div>
              <p className="mb-6 text-neutral-700 dark:text-neutral-300">
                Please take time to read and reflect on this content before proceeding.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <svg
                  className="h-5 w-5 animate-spin"
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
                <span>Minimum dwell time: {checkpoint.minimumDwellSeconds} seconds</span>
              </div>
            </div>
          ) : (
            // Checkpoint Form
            <>
              <div className="mb-6">
                <div className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
                  Formation Checkpoint
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {checkpoint.context}
                </p>
              </div>

              <form action={action} className="space-y-6">
                {/* Hidden fields */}
                <input type="hidden" name="checkpointId" value={checkpoint.id} />
                <input type="hidden" name="sectionId" value={section.id} />
                <input type="hidden" name="phase" value={section.phase} />
                <input
                  type="hidden"
                  name="dwellTimeSeconds"
                  value={Math.floor((Date.now() - dwellStartTime) / 1000)}
                />

                {/* Reflection Prompt */}
                <div>
                  <label
                    htmlFor="reflection"
                    className="mb-3 block text-base font-medium text-neutral-900 dark:text-white"
                  >
                    {checkpoint.prompt}
                  </label>
                  <textarea
                    id="reflection"
                    name="reflection"
                    required
                    disabled={pending}
                    rows={8}
                    placeholder="Take your time. Formation requires honest reflection, not performance."
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
                  />
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    This reflection is for your formation, not evaluation. Be honest.
                  </p>
                </div>

                {/* Error Message */}
                {state.message && !state.ok && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200">
                    {state.message}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-700 dark:hover:bg-amber-600"
                  >
                    {pending ? "Submitting..." : "Submit Reflection"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        {/* Navigation hint */}
        {showCheckpoint && (
          <footer className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Complete this checkpoint to continue your formation journey.
          </footer>
        )}
      </div>
    </div>
  );
}
