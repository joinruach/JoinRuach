"use client";

import { use, useEffect, useState } from "react";
import { useActionState } from "react";
import { FormationSection, Checkpoint } from "@ruach/formation";
import { submitCheckpoint, trackDwellHeartbeat, getUserId } from "./actions";
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

// ============================================================================
// WORD COUNT UTILITY (Unicode-safe, deterministic)
// ============================================================================

/**
 * Deterministic word count algorithm
 * Matches server-side validation in actions.ts
 *
 * Unicode-safe: Uses [\p{L}\p{N}] to match letters and numbers across all languages
 * (Hebrew, Greek, accents, etc.) instead of ASCII-only \w pattern
 */
function countWords(text: string): number {
  // Normalize: trim leading/trailing whitespace
  const normalized = text.trim();

  // Handle empty string
  if (normalized.length === 0) return 0;

  // Split on any whitespace (space, tab, newline)
  const tokens = normalized.split(/\s+/);

  // Filter out empty tokens and punctuation-only tokens
  // Unicode-safe: matches letters (including Hebrew/Greek) and numbers, not just ASCII
  const HAS_WORD = /[\p{L}\p{N}]/u;
  const words = tokens.filter(token => {
    return token.length > 0 && HAS_WORD.test(token);
  });

  return words.length;
}

export function SectionView({ locale, section, checkpoint }: SectionViewProps) {
  const [dwellStartTime] = useState(() => Date.now());
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [state, action, pending] = useActionState(submitCheckpoint, initialState);

  // Word count state
  const [reflection, setReflection] = useState("");
  const [wordCount, setWordCount] = useState(0);

  // Heartbeat tracking state
  const [attemptId] = useState(() => {
    return `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });
  const [heartbeatSeq, setHeartbeatSeq] = useState(0);
  const [serverAccumulatedSeconds, setServerAccumulatedSeconds] = useState(0);
  const [lastVisibleAt, setLastVisibleAt] = useState<number | null>(null);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch userId on mount
  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // Track section view on mount
  useEffect(() => {
    // Emit SectionViewedEvent (placeholder for now)
    console.log("[Formation Event] SectionViewed", {
      sectionId: section.id,
      phase: section.phase,
      timestamp: new Date().toISOString(),
    });
  }, [section.id, section.phase]);

  // Handle reflection changes
  const handleReflectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setReflection(text);
    setWordCount(countWords(text));
  };

  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };

    const handlePageHide = () => {
      // Safari/iOS: ensure cleanup on page hide
      setIsTabVisible(false);
      setLastVisibleAt(null);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    // Initialize on mount
    if (document.visibilityState === 'visible') {
      setLastVisibleAt(performance.now());
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, []);

  // Update display time every second (optimistic + server reconciliation)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTabVisible && lastVisibleAt !== null) {
        // Optimistic: show local elapsed time since last visible
        const localElapsed = Math.floor((performance.now() - lastVisibleAt) / 1000);
        setDisplaySeconds(serverAccumulatedSeconds + localElapsed);
      } else {
        // Hidden: show server truth
        setDisplaySeconds(serverAccumulatedSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTabVisible, lastVisibleAt, serverAccumulatedSeconds]);

  // Send heartbeat ping every 10 seconds
  useEffect(() => {
    if (!isTabVisible || !userId) return;

    const heartbeatInterval = setInterval(async () => {
      if (isTabVisible && userId) {
        // Increment sequence (monotonic)
        const seq = heartbeatSeq + 1;
        setHeartbeatSeq(seq);

        const formData = new FormData();
        formData.append('sectionId', section.id);
        formData.append('checkpointId', checkpoint.id);
        formData.append('userId', userId);
        formData.append('attemptId', attemptId);
        formData.append('heartbeatSeq', seq.toString());

        const response = await trackDwellHeartbeat(formData);

        // Reconcile with server truth
        if (response.ok) {
          setServerAccumulatedSeconds(response.accumulatedSeconds);
          // Reset local tracking baseline
          setLastVisibleAt(performance.now());
        }
      }
    }, 10000); // 10 seconds

    return () => clearInterval(heartbeatInterval);
  }, [isTabVisible, heartbeatSeq, section.id, checkpoint.id, userId, attemptId]);

  // Calculate minimum wait time for checkpoint
  const minimumWaitMs = checkpoint.minimumDwellSeconds * 1000;

  // Check if minimum dwell time has passed
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCheckpoint(true);
    }, minimumWaitMs);

    return () => clearTimeout(timer);
  }, [minimumWaitMs]);

  // Calculate submit button state
  const dwellRequirementMet = displaySeconds >= checkpoint.minimumDwellSeconds;
  const wordRequirementMet = wordCount >= 50;
  const canSubmit = dwellRequirementMet && wordRequirementMet && showCheckpoint;

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
                <input type="hidden" name="attemptId" value={attemptId} />
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
                    value={reflection}
                    onChange={handleReflectionChange}
                    required
                    disabled={pending}
                    rows={8}
                    placeholder="Take your time. Formation requires honest reflection, not performance."
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
                  />
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className={wordCount >= 50 ? "text-green-600 dark:text-green-400 font-medium" : "text-neutral-600 dark:text-neutral-400"}>
                      {wordCount} / 50 words {wordCount >= 50 ? "✓" : ""}
                    </span>
                    {wordCount < 50 && (
                      <span className="text-amber-600 dark:text-amber-400">
                        {50 - wordCount} remaining
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    This reflection is for your formation, not evaluation. Be honest.
                  </p>
                </div>

                {/* Dwell Time Progress */}
                <div className="flex items-center gap-2 text-sm">
                  <span className={dwellRequirementMet ? "text-green-600 dark:text-green-400 font-medium" : "text-neutral-600 dark:text-neutral-400"}>
                    Time: {displaySeconds}s / {checkpoint.minimumDwellSeconds}s {dwellRequirementMet ? "✓" : ""}
                  </span>
                  {!isTabVisible && (
                    <span className="text-amber-600 dark:text-amber-400 text-xs">
                      (paused - tab not visible)
                    </span>
                  )}
                </div>

                {/* Requirements Checklist */}
                <div className="mb-4 space-y-2 text-sm">
                  <div className={dwellRequirementMet ? "text-green-600 dark:text-green-400" : "text-neutral-500"}>
                    {dwellRequirementMet ? "✓" : "○"} Minimum reading time ({checkpoint.minimumDwellSeconds}s)
                  </div>
                  <div className={wordRequirementMet ? "text-green-600 dark:text-green-400" : "text-neutral-500"}>
                    {wordRequirementMet ? "✓" : "○"} Minimum reflection length (50 words)
                  </div>
                </div>

                {/* Error Message */}
                {state.message && !state.ok && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-200">
                    {state.message}
                  </div>
                )}

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={!canSubmit || pending}
                    className={`w-full rounded-xl px-6 py-4 font-bold text-white transition-all ${
                      canSubmit && !pending
                        ? "bg-amber-600 hover:bg-amber-700 cursor-pointer"
                        : "bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed opacity-50"
                    }`}
                  >
                    {pending ? "Submitting..." : canSubmit ? "Submit Reflection" : "Complete Requirements to Submit"}
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
