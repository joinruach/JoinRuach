"use client";

import { useState, useCallback, useMemo } from "react";
import { FormationState } from "@ruach/formation";
import { Search, Filter, Calendar } from "lucide-react";

interface ReflectionArchiveProps {
  state: FormationState;
  locale: string;
}

interface ReflectionFilter {
  searchTerm: string;
  phase?: string;
  sortBy: "newest" | "oldest";
}

/**
 * Searchable and filterable reflection archive
 * Shows user's reflection history with search and filtering
 */
export function ReflectionArchive({
  state,
  locale,
}: ReflectionArchiveProps) {
  const [filters, setFilters] = useState<ReflectionFilter>({
    searchTerm: "",
    sortBy: "newest",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Mock reflection data - in production, this would come from API
  const mockReflections = useMemo(() => {
    return state.checkpointsCompleted.map((checkpointId, idx) => ({
      id: `reflection-${idx}`,
      checkpointId,
      checkpointTitle: `Checkpoint ${checkpointId.split("-").pop()}`,
      phase: state.currentPhase,
      submittedAt: new Date(
        state.updatedAt.getTime() - (state.checkpointsCompleted.length - idx) * 86400000
      ),
      wordCount: 120 + Math.random() * 200,
      preview: `This is a reflection from checkpoint ${checkpointId}. Your actual reflections would appear here with the ability to search and filter through your formation journey.`,
    }));
  }, [state]);

  // Apply filters
  const filteredReflections = useMemo(() => {
    let results = [...mockReflections];

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      results = results.filter(
        (r) =>
          r.checkpointTitle.toLowerCase().includes(term) ||
          r.preview.toLowerCase().includes(term)
      );
    }

    // Phase filter
    if (filters.phase) {
      results = results.filter((r) => r.phase === filters.phase);
    }

    // Sort
    results.sort((a, b) => {
      const timeDiff = b.submittedAt.getTime() - a.submittedAt.getTime();
      return filters.sortBy === "newest" ? timeDiff : -timeDiff;
    });

    return results;
  }, [mockReflections, filters]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setFilters((f) => ({ ...f, searchTerm: value }));
    },
    []
  );

  const handlePhaseFilter = useCallback(
    (phase: string | undefined) => {
      setFilters((f) => ({ ...f, phase }));
    },
    []
  );

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header with Search */}
      <div className="border-b border-neutral-200 p-6 dark:border-neutral-800">
        <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
          Reflection Search
        </h3>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search reflections..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-neutral-900 placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Phase Filter */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                sortBy: e.target.value as "newest" | "oldest",
              }))
            }
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* Clear filters */}
          {(filters.searchTerm || filters.phase) && (
            <button
              onClick={() =>
                setFilters({ searchTerm: "", sortBy: "newest" })
              }
              className="text-xs text-neutral-500 underline hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {filteredReflections.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              {mockReflections.length === 0
                ? "No reflections yet. Complete checkpoints to start building your reflection archive."
                : "No reflections match your search."}
            </p>
          </div>
        ) : (
          filteredReflections.map((reflection, idx) => (
            <div
              key={reflection.id}
              className="p-6 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-neutral-900 dark:text-white">
                    {reflection.checkpointTitle}
                  </h4>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(reflection.submittedAt)}
                    </div>
                    <div>
                      {Math.round(reflection.wordCount)} words
                    </div>
                    <div className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {reflection.phase}
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
                    {reflection.preview}
                  </p>
                </div>

                <button className="flex-shrink-0 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer with count */}
      <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Showing {filteredReflections.length} of {mockReflections.length} reflection
          {mockReflections.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
