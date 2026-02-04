'use client';

/**
 * Universal Queue Table Component
 *
 * Reusable table for all studio workflows:
 * - Operator Inbox
 * - Render Jobs
 * - Ingestion Queue
 * - Publishing Queue
 * - Sessions List
 *
 * Replaces 5+ duplicate table implementations with a single unified component.
 */

import Link from 'next/link';
import Image from 'next/image';
import type { InboxItem } from '@/lib/studio/types';
import { imgUrl } from '@/lib/strapi';

type ColumnType = 'thumbnail' | 'title' | 'status' | 'priority' | 'reason' | 'actions' | 'updated';

interface QueueTableProps {
  items: InboxItem[];
  locale: string;
  columns?: ColumnType[];
  onAction?: (itemId: string, action: string) => void | Promise<void>;
  emptyMessage?: string;
  emptyIcon?: string;
}

/**
 * Default columns if not specified
 */
const DEFAULT_COLUMNS: ColumnType[] = ['thumbnail', 'title', 'status', 'priority', 'reason', 'updated', 'actions'];

/**
 * Status badge styles (extends existing StatusBadge patterns)
 */
const STATUS_STYLES: Record<string, string> = {
  // Ingest workflow
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  reviewing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',

  // Render workflow
  queued: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  rendering: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  encoding: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  uploading: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',

  // Publish workflow
  scheduled: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',

  // Terminal states
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  archived: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

/**
 * Priority badge styles
 */
const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

/**
 * Action button labels
 */
const ACTION_LABELS: Record<string, string> = {
  review: 'Review',
  approve: 'Approve',
  reject: 'Reject',
  retry: 'Retry',
  cancel: 'Cancel',
  edit: 'Edit',
  publish: 'Publish',
  archive: 'Archive',
  delete: 'Delete',
};

export default function QueueTable({
  items,
  locale,
  columns = DEFAULT_COLUMNS,
  onAction,
  emptyMessage = 'No items found. Try adjusting your filters.',
  emptyIcon = '📭',
}: QueueTableProps) {
  // Empty state
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-6xl mb-4">{emptyIcon}</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Column headers
  const renderHeader = (column: ColumnType) => {
    const headers: Record<ColumnType, string> = {
      thumbnail: '',
      title: 'Item',
      status: 'Status',
      priority: 'Priority',
      reason: 'Reason',
      updated: 'Updated',
      actions: 'Actions',
    };
    return headers[column];
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                  column === 'actions' ? 'text-right' : ''
                }`}
              >
                {renderHeader(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {columns.includes('thumbnail') && (
                <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    const thumbnail = item.thumbnailUrl ? imgUrl(item.thumbnailUrl) : null;
                    return thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={item.title}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl">
                        {item.icon || '🎬'}
                      </div>
                    );
                  })()}
                </td>
              )}

              {columns.includes('title') && (
                <td className="px-6 py-4">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate max-w-md">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {item.subtitle}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {item.entityType} · ID: {item.entityId}
                    </div>
                  </div>
                </td>
              )}

              {columns.includes('status') && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_STYLES[item.status] || STATUS_STYLES.pending
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              )}

              {columns.includes('priority') && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      PRIORITY_STYLES[item.priority]
                    }`}
                  >
                    {item.priority}
                  </span>
                </td>
              )}

              {columns.includes('reason') && (
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700 dark:text-gray-300 max-w-sm truncate">
                    {item.reason}
                  </div>
                </td>
              )}

              {columns.includes('updated') && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </td>
              )}

              {columns.includes('actions') && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {item.availableActions.map((action) => (
                      <button
                        key={action}
                        onClick={() => onAction?.(item.id, action)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          action === item.primaryAction
                            ? 'bg-ruachGold text-white hover:bg-ruachGold/90'
                            : action === 'delete' || action === 'reject' || action === 'cancel'
                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {ACTION_LABELS[action] || action}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
