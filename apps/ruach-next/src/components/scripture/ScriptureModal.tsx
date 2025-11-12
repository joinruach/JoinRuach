"use client";

import { useEffect, useState } from "react";
import {
  getScripture,
  copyScriptureToClipboard,
  shareScripture,
  trackScriptureEvent,
  type ScripturePassage,
} from "@/lib/scripture";

export interface ScriptureModalProps {
  reference: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ScriptureModal - Modal dialog for displaying scripture
 *
 * Features:
 * - Fetches scripture from Bible API
 * - Copy to clipboard
 * - Share via Web Share API
 * - Loading and error states
 * - Keyboard navigation (Esc to close)
 *
 * Usage:
 * <ScriptureModal
 *   reference="John 3:16"
 *   isOpen={modalOpen}
 *   onClose={() => setModalOpen(false)}
 * />
 */
export default function ScriptureModal({
  reference,
  isOpen,
  onClose,
}: ScriptureModalProps) {
  const [passage, setPassage] = useState<ScripturePassage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !reference) {
      setPassage(null);
      setError(null);
      return;
    }

    const fetchPassage = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getScripture(reference);

        if (result) {
          setPassage(result);
          trackScriptureEvent("view", reference);
        } else {
          setError("Scripture not found. Please check the reference.");
        }
      } catch (err) {
        setError("Failed to load scripture. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPassage();
  }, [reference, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    if (!passage) return;

    const success = await copyScriptureToClipboard(passage);

    if (success) {
      setCopied(true);
      trackScriptureEvent("copy", reference);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!passage) return;

    const success = await shareScripture(passage);

    if (success) {
      trackScriptureEvent("share", reference);
    } else {
      // Fallback to copy if share fails
      handleCopy();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="scripture-modal-title"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-neutral-800">
          <div className="flex items-center gap-2">
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
            <h2
              id="scripture-modal-title"
              className="text-lg font-semibold text-neutral-900 dark:text-white"
            >
              {reference}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-white"
            aria-label="Close"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          {passage && !loading && (
            <div className="space-y-4">
              {passage.verses.map((verse, index) => (
                <p
                  key={`${verse.chapter}-${verse.verse}`}
                  className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300"
                >
                  <span className="mr-2 font-semibold text-amber-600 dark:text-amber-400">
                    {verse.verse}
                  </span>
                  {verse.text}
                </p>
              ))}

              {/* Copyright */}
              {passage.copyright && (
                <p className="pt-4 text-xs text-neutral-500 dark:text-neutral-400">
                  {passage.copyright}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {passage && !loading && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-neutral-800">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-100 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
              >
                {copied ? (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-100 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  Share
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
