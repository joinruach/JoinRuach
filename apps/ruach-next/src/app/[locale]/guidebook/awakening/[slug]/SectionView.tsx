"use client";

import { use, useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { FormationSection, Checkpoint } from "@ruach/formation";
import { submitCheckpoint, trackDwellHeartbeat, getUserId } from "./actions";
import { Prose } from "@/components/Prose";
import { VoiceRecorder } from "@/components/formation/VoiceRecorder";

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

/**
 * Generate draft key for localStorage
 */
function getDraftKey(locale: string, sectionId: string, checkpointId: string): string {
  return `draft:guidebook:${locale}:${sectionId}:${checkpointId}`;
}

function formatDurationSeconds(seconds: number): string {
  const clampedSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(clampedSeconds / 60);
  const remainingSeconds = clampedSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function SectionView({ locale, section, checkpoint }: SectionViewProps) {
  const [state, action, pending] = useActionState(submitCheckpoint, initialState);

  // Word count state with draft restoration
  const [reflection, setReflection] = useState(() => {
    if (typeof window === "undefined") return "";
    const draftKey = getDraftKey(locale, section.id, checkpoint.id);
    const saved = localStorage.getItem(draftKey);
    return saved || "";
  });

  const [wordCount, setWordCount] = useState(() => {
    if (typeof window === "undefined") return 0;
    const draftKey = getDraftKey(locale, section.id, checkpoint.id);
    const saved = localStorage.getItem(draftKey);
    return saved ? countWords(saved) : 0;
  });

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
  const [heartbeatEnabled, setHeartbeatEnabled] = useState(true);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const serverAccumulatedSecondsRef = useRef(0);
  const lastVisibleAtRef = useRef<number | null>(null);

  const setServerAccumulatedSecondsSafe = (value: number) => {
    serverAccumulatedSecondsRef.current = value;
    setServerAccumulatedSeconds(value);
  };

  const setLastVisibleAtSafe = (value: number | null) => {
    lastVisibleAtRef.current = value;
    setLastVisibleAt(value);
  };

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

  // Handle blur (immediate save)
  const handleBlur = () => {
    const draftKey = getDraftKey(locale, section.id, checkpoint.id);
    if (reflection) {
      localStorage.setItem(draftKey, reflection);
    }
  };

  // Save draft with debouncing (500ms delay to reduce write frequency)
  useEffect(() => {
    const draftKey = getDraftKey(locale, section.id, checkpoint.id);

    // Debounce: wait 500ms after last change before saving
    const timeoutId = setTimeout(() => {
      if (reflection) {
        localStorage.setItem(draftKey, reflection);
      } else {
        // Clear if empty
        localStorage.removeItem(draftKey);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [reflection, locale, section.id, checkpoint.id]);

  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      setIsTabVisible(isVisible);

      if (isVisible) {
        setLastVisibleAtSafe(performance.now());
        return;
      }

      // If we're not server-backed, preserve local accumulated time when the tab hides.
      if (!heartbeatEnabled) {
        const last = lastVisibleAtRef.current;
        if (last !== null) {
          const localElapsed = Math.floor((performance.now() - last) / 1000);
          setServerAccumulatedSecondsSafe(
            serverAccumulatedSecondsRef.current + Math.max(0, localElapsed)
          );
        }
      }

      setLastVisibleAtSafe(null);
    };

    const handlePageHide = () => {
      // Safari/iOS: ensure cleanup on page hide
      setIsTabVisible(false);
      setLastVisibleAtSafe(null);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    // Initialize on mount
    if (document.visibilityState === "visible") {
      setLastVisibleAtSafe(performance.now());
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [heartbeatEnabled]);

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
    if (!heartbeatEnabled || !isTabVisible || !userId) return;

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

        if (!response.redisEnabled) {
          setHeartbeatEnabled(false);
          return;
        }

        // Reconcile with server truth
        if (response.ok) {
          setServerAccumulatedSecondsSafe(response.accumulatedSeconds);
          // Reset local tracking baseline
          setLastVisibleAtSafe(performance.now());
        }
      }
    }, 10000); // 10 seconds

    return () => clearInterval(heartbeatInterval);
  }, [heartbeatEnabled, isTabVisible, heartbeatSeq, section.id, checkpoint.id, userId, attemptId]);

  const remainingDwellSeconds = Math.max(0, checkpoint.minimumDwellSeconds - displaySeconds);
  const showCheckpoint = remainingDwellSeconds <= 0;
  const dwellProgress =
    checkpoint.minimumDwellSeconds > 0
      ? Math.max(0, Math.min(1, displaySeconds / checkpoint.minimumDwellSeconds))
      : 1;
  const ringRadius = 16;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - dwellProgress);

  // Calculate submit button state
  const dwellRequirementMet = displaySeconds >= checkpoint.minimumDwellSeconds;
  const wordRequirementMet = wordCount >= 50;
  const canSubmit = dwellRequirementMet && wordRequirementMet && showCheckpoint;

  // Clear draft ONLY on confirmed successful submission
  useEffect(() => {
    // Only clear if submission was successful AND has redirect URL
    if (state.ok && state.redirectTo) {
      const draftKey = getDraftKey(locale, section.id, checkpoint.id);
      localStorage.removeItem(draftKey);
    }
    // If state.ok === false, draft remains intact for retry
  }, [state, locale, section.id, checkpoint.id]);

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
              <div className="flex flex-col items-center justify-center gap-3">
                <div
                  className="relative h-20 w-20"
                  role="img"
                  aria-label={`Reading time progress: ${displaySeconds} of ${checkpoint.minimumDwellSeconds} seconds`}
                >
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r={ringRadius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      className="text-neutral-300/70 dark:text-neutral-700/70"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r={ringRadius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${ringCircumference} ${ringCircumference}`}
                      strokeDashoffset={ringDashOffset}
                      className="text-amber-600 dark:text-amber-400"
                      style={{ transition: "stroke-dashoffset 250ms linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-base font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {formatDurationSeconds(remainingDwellSeconds)}
                    </div>
                    <div className="text-[11px] text-neutral-600 dark:text-neutral-400 tabular-nums">
                      remaining
                    </div>
                  </div>
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
                  {displaySeconds}s / {checkpoint.minimumDwellSeconds}s
                  {!isTabVisible && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                      (paused)
                    </span>
                  )}
                </div>
                <div className="w-full max-w-xs">
                  <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
                    <div
                      className="h-2 rounded-full bg-amber-600 dark:bg-amber-400"
                      style={{ width: `${Math.round(dwellProgress * 100)}%`, transition: "width 250ms linear" }}
                    />
                  </div>
                </div>
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
                  value={displaySeconds}
                />

                {/* Reflection Prompt */}
                <div>
                  <label
                    htmlFor="reflection"
                    className="mb-3 block text-base font-medium text-neutral-900 dark:text-white"
                  >
                    {checkpoint.prompt}
                  </label>

                  {/* Voice Recording Option */}
                  {!showVoiceRecorder && (
                    <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
                        💭 Prefer to speak your reflection instead of typing?
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowVoiceRecorder(true)}
                        className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Try Voice Recording
                      </button>
                    </div>
                  )}

                  {showVoiceRecorder && (
                    <div className="mb-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                          Voice Recording
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowVoiceRecorder(false)}
                          className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Type instead
                        </button>
                      </div>
                      <VoiceRecorder
                        disabled={pending}
                        onTranscriptionStart={() => {
                          // Show loading state
                        }}
                        onTranscriptionComplete={(text) => {
                          setReflection(text);
                          setWordCount(countWords(text));
                          setShowVoiceRecorder(false);
                        }}
                        onTranscriptionError={(error) => {
                          console.error("Transcription error:", error);
                        }}
                      />
                    </div>
                  )}

                  <textarea
                    id="reflection"
                    name="reflection"
                    value={reflection}
                    onChange={handleReflectionChange}
                    onBlur={handleBlur}
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
                    <div className="flex items-center gap-4">
                      {wordCount < 50 && (
                        <span className="text-amber-600 dark:text-amber-400">
                          {50 - wordCount} remaining
                        </span>
                      )}
                      {reflection && (
                        <button
                          type="button"
                          onClick={() => {
                            const draftKey = getDraftKey(locale, section.id, checkpoint.id);
                            setReflection("");
                            setWordCount(0);
                            localStorage.removeItem(draftKey);
                          }}
                          className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 underline"
                        >
                          Clear Draft
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    This reflection is for your formation, not evaluation. Be honest.
                  </p>
                </div>

                {/* Dwell Time Progress */}
                <div className="flex items-center gap-2 text-sm">
                  <span className={dwellRequirementMet ? "text-green-600 dark:text-green-400 font-medium" : "text-neutral-600 dark:text-neutral-400"}>
                    Time: {displaySeconds}s / {checkpoint.minimumDwellSeconds}s ({formatDurationSeconds(remainingDwellSeconds)} remaining) {dwellRequirementMet ? "✓" : ""}
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
