'use client';

/**
 * Universal Queue Filters Component
 *
 * Reusable filtering UI for all queue tables.
 * Supports filtering by status, priority, category, and search.
 */

import { useState } from 'react';
import type { WorkflowStatus, WorkflowPriority, WorkflowCategory } from '@/lib/studio/types';

interface QueueFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  availableStatuses?: WorkflowStatus[];
  availablePriorities?: WorkflowPriority[];
  availableCategories?: WorkflowCategory[];
  showSearch?: boolean;
  showStatus?: boolean;
  showPriority?: boolean;
  showCategory?: boolean;
}

export interface FilterState {
  status: WorkflowStatus[];
  priority: WorkflowPriority[];
  category: WorkflowCategory[];
  search: string;
}

const DEFAULT_STATUSES: WorkflowStatus[] = [
  'pending',
  'processing',
  'reviewing',
  'approved',
  'rejected',
  'queued',
  'rendering',
  'failed',
  'completed',
];

const DEFAULT_PRIORITIES: WorkflowPriority[] = ['urgent', 'high', 'normal', 'low'];

const DEFAULT_CATEGORIES: WorkflowCategory[] = ['ingest', 'edit', 'render', 'publish', 'library'];

/**
 * Status label mapping
 */
const STATUS_LABELS: Record<WorkflowStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  reviewing: 'Reviewing',
  approved: 'Approved',
  rejected: 'Rejected',
  queued: 'Queued',
  rendering: 'Rendering',
  encoding: 'Encoding',
  uploading: 'Uploading',
  scheduled: 'Scheduled',
  published: 'Published',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  archived: 'Archived',
};

/**
 * Priority label mapping
 */
const PRIORITY_LABELS: Record<WorkflowPriority, string> = {
  urgent: '🔴 Urgent',
  high: '🟠 High',
  normal: '🔵 Normal',
  low: '⚪ Low',
};

/**
 * Category label mapping
 */
const CATEGORY_LABELS: Record<WorkflowCategory, string> = {
  ingest: '📥 Ingest',
  edit: '✂️ Edit',
  render: '🎞️ Render',
  publish: '🚀 Publish',
  library: '📚 Library',
};

export default function QueueFilters({
  onFilterChange,
  availableStatuses = DEFAULT_STATUSES,
  availablePriorities = DEFAULT_PRIORITIES,
  availableCategories = DEFAULT_CATEGORIES,
  showSearch = true,
  showStatus = true,
  showPriority = true,
  showCategory = true,
}: QueueFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    category: [],
    search: '',
  });

  const [isOpen, setIsOpen] = useState(false);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const toggleArrayFilter = <K extends 'status' | 'priority' | 'category'>(
    key: K,
    value: FilterState[K][number]
  ) => {
    const current = filters[key] as typeof value[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    updateFilters({ [key]: updated });
  };

  const clearFilters = () => {
    const cleared = {
      status: [],
      priority: [],
      category: [],
      search: '',
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.category.length > 0 ||
    filters.search.length > 0;

  return (
    <div className="mb-4">
      {/* Top bar with search and filter toggle */}
      <div className="flex items-center gap-3 mb-3">
        {showSearch && (
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search items..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-ruachGold focus:border-transparent"
            />
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            hasActiveFilters
              ? 'border-ruachGold bg-ruachGold/10 text-ruachGold'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          🔍 Filters {hasActiveFilters && `(${Object.values(filters).flat().filter(Boolean).length})`}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Expandable filter panel */}
      {isOpen && (
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-4">
          {showStatus && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {availableStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleArrayFilter('status', status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filters.status.includes(status)
                        ? 'bg-ruachGold text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showPriority && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {availablePriorities.map((priority) => (
                  <button
                    key={priority}
                    onClick={() => toggleArrayFilter('priority', priority)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filters.priority.includes(priority)
                        ? 'bg-ruachGold text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {PRIORITY_LABELS[priority]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleArrayFilter('category', category)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filters.category.includes(category)
                        ? 'bg-ruachGold text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {CATEGORY_LABELS[category]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && !isOpen && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.status.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {STATUS_LABELS[status]}
              <button
                onClick={() => toggleArrayFilter('status', status)}
                className="hover:text-blue-900 dark:hover:text-blue-100"
              >
                ×
              </button>
            </span>
          ))}
          {filters.priority.map((priority) => (
            <span
              key={priority}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
            >
              {PRIORITY_LABELS[priority]}
              <button
                onClick={() => toggleArrayFilter('priority', priority)}
                className="hover:text-orange-900 dark:hover:text-orange-100"
              >
                ×
              </button>
            </span>
          ))}
          {filters.category.map((category) => (
            <span
              key={category}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            >
              {CATEGORY_LABELS[category]}
              <button
                onClick={() => toggleArrayFilter('category', category)}
                className="hover:text-purple-900 dark:hover:text-purple-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
