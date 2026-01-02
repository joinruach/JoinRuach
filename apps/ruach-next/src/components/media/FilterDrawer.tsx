"use client";

import { useState } from "react";

export interface MediaFilters {
  category?: string;
  speaker?: string;
  duration?: "any" | "short" | "medium" | "long";
  dateRange?: "any" | "30" | "365";
  tags?: string[];
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: MediaFilters;
  onApply: (filters: MediaFilters) => void;
  categories: Array<{ value: string; label: string }>;
  speakers: Array<{ value: string; label: string }>;
  tags: Array<{ value: string; label: string }>;
}

export function FilterDrawer({
  isOpen,
  onClose,
  filters: initialFilters,
  onApply,
  categories,
  speakers,
  tags,
}: FilterDrawerProps) {
  const [filters, setFilters] = useState<MediaFilters>(initialFilters);

  const handleReset = () => {
    const resetFilters: MediaFilters = {
      category: undefined,
      speaker: undefined,
      duration: "any",
      dateRange: "any",
      tags: [],
    };
    setFilters(resetFilters);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl dark:bg-neutral-900 md:w-96">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 dark:border-white/10 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Filters
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/10"
              aria-label="Close filters"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filter Options */}
          <div className="flex-1 space-y-6 px-6 py-6">
            {/* Category */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
                Category
              </h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label key={cat.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={filters.category === cat.value}
                      onChange={(e) =>
                        setFilters({ ...filters, category: e.target.value })
                      }
                      className="h-4 w-4 text-amber-600"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {cat.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Speaker */}
            {speakers.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
                  Speaker
                </h3>
                <select
                  value={filters.speaker || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, speaker: e.target.value || undefined })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-white/10 dark:bg-neutral-800 dark:text-white"
                >
                  <option value="">All Speakers</option>
                  {speakers.map((speaker) => (
                    <option key={speaker.value} value={speaker.value}>
                      {speaker.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Duration */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
                Duration
              </h3>
              <div className="space-y-2">
                {[
                  { value: "any", label: "Any" },
                  { value: "short", label: "Under 10 min" },
                  { value: "medium", label: "10–30 min" },
                  { value: "long", label: "30+ min" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="duration"
                      value={opt.value}
                      checked={filters.duration === opt.value}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          duration: e.target.value as MediaFilters["duration"],
                        })
                      }
                      className="h-4 w-4 text-amber-600"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
                Date
              </h3>
              <div className="space-y-2">
                {[
                  { value: "any", label: "Any time" },
                  { value: "30", label: "Last 30 days" },
                  { value: "365", label: "Past year" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="dateRange"
                      value={opt.value}
                      checked={filters.dateRange === opt.value}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateRange: e.target.value as MediaFilters["dateRange"],
                        })
                      }
                      className="h-4 w-4 text-amber-600"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 border-t border-neutral-200 bg-white px-6 py-4 dark:border-white/10 dark:bg-neutral-900">
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
