"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MediaGrid from "./MediaGrid";
import { SearchBar } from "./SearchBar";
import { SortDropdown, type SortOption } from "./SortDropdown";
import { FilterDrawer, type MediaFilters } from "./FilterDrawer";
import type { MediaCardProps } from "@/components/ruach/MediaCard";

interface MediaBrowserProps {
  initialItems: MediaCardProps[];
  categories: Array<{ value: string; label: string }>;
  speakers: Array<{ value: string; label: string }>;
}

export function MediaBrowser({
  initialItems,
  categories,
  speakers,
}: MediaBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParams = searchParams ?? new URLSearchParams();

  // State
  const [searchQuery, setSearchQuery] = useState(initialParams.get("q") || "");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>(
    (initialParams.get("sort") as SortOption) || "latest"
  );
  const [filters, setFilters] = useState<MediaFilters>({
    category: initialParams.get("category") || undefined,
    speaker: initialParams.get("speaker") || undefined,
    duration: (initialParams.get("duration") as MediaFilters["duration"]) || "any",
    dateRange: (initialParams.get("range") as MediaFilters["dateRange"]) || "any",
  });

  // Filter and sort items client-side
  const filteredItems = useMemo(() => {
    let items = [...initialItems];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.excerpt?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          item.speakers?.some((s) => s.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filters.category && filters.category !== "all") {
      items = items.filter((item) => item.category === filters.category);
    }

    // Speaker filter
    if (filters.speaker) {
      items = items.filter((item) =>
        item.speakers?.some((s) => s === filters.speaker)
      );
    }

    // Duration filter
    if (filters.duration && filters.duration !== "any") {
      items = items.filter((item) => {
        if (!item.durationSec) return false;
        const minutes = item.durationSec / 60;
        switch (filters.duration) {
          case "short":
            return minutes < 10;
          case "medium":
            return minutes >= 10 && minutes <= 30;
          case "long":
            return minutes > 30;
          default:
            return true;
        }
      });
    }

    // Sort
    switch (sortBy) {
      case "latest":
        // Already sorted by default
        break;
      case "oldest":
        items.reverse();
        break;
      case "most-viewed":
        items.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "most-liked":
        items.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case "longest":
        items.sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0));
        break;
      case "shortest":
        items.sort((a, b) => (a.durationSec || 0) - (b.durationSec || 0));
        break;
    }

    return items;
  }, [initialItems, searchQuery, filters, sortBy]);

  const handleSearch = () => {
    // Search is handled by useMemo, no need for additional action
  };

  const handleApplyFilters = (newFilters: MediaFilters) => {
    setFilters(newFilters);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category && filters.category !== "all") count++;
    if (filters.speaker) count++;
    if (filters.duration && filters.duration !== "any") count++;
    if (filters.dateRange && filters.dateRange !== "any") count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Top Bar: Search + Filters + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Search (flex-1) */}
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search media..."
          />
        </div>

        {/* Filters Button */}
        <button
          onClick={() => setIsFilterDrawerOpen(true)}
          className="relative rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 dark:border-white/10 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
        >
          <span className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </span>
        </button>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">Sort:</span>
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      {/* Results Summary */}
      {(searchQuery || activeFilterCount > 0) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {searchQuery && (
              <>
                Results for <span className="font-semibold text-neutral-900 dark:text-white">&quot;{searchQuery}&quot;</span> ·{" "}
              </>
            )}
            <span className="font-semibold">{filteredItems.length}</span> items
          </p>

          {(searchQuery || activeFilterCount > 0) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilters({
                  category: undefined,
                  speaker: undefined,
                  duration: "any",
                  dateRange: "any",
                });
              }}
              className="text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Media Grid */}
      {filteredItems.length > 0 ? (
        <MediaGrid items={filteredItems} />
      ) : (
        <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center dark:border-white/10 dark:bg-white/5">
          <p className="text-lg font-medium text-neutral-900 dark:text-white">
            No media found
          </p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
        categories={categories}
        speakers={speakers}
        tags={[]}
      />
    </div>
  );
}
