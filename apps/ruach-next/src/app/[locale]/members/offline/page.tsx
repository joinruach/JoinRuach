"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getOfflineItems,
  getOfflineStatus,
  removeFromOffline,
  clearOfflineItems,
  cleanupExpiredItems,
  formatBytes,
  OfflineItem,
  OfflineStatus,
} from '@/lib/offline/offlineManager';

/**
 * Offline Content Manager Page
 *
 * Displays all content available offline and storage management.
 *
 * Features:
 * - List all offline content
 * - Remove individual items
 * - Clear all offline content
 * - Show storage usage
 * - Cleanup expired items
 *
 * @example
 * Navigate to /members/offline to access this page
 */
export default function OfflineManagerPage() {
  const [items, setItems] = useState<OfflineItem[]>([]);
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const [offlineItems, offlineStatus] = await Promise.all([
        getOfflineItems(),
        getOfflineStatus(),
      ]);

      setItems(offlineItems);
      setStatus(offlineStatus);
    } catch (error) {
      console.error('Failed to load offline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await removeFromOffline(id);
      await loadData();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to remove all offline content?')) {
      return;
    }

    try {
      await clearOfflineItems();
      await loadData();
    } catch (error) {
      console.error('Failed to clear offline items:', error);
    }
  };

  const handleCleanup = async () => {
    try {
      const cleaned = await cleanupExpiredItems();
      alert(`Cleaned up ${cleaned} expired ${cleaned === 1 ? 'item' : 'items'}`);
      await loadData();
    } catch (error) {
      console.error('Failed to cleanup:', error);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) return;

    if (
      !confirm(
        `Remove ${selectedItems.size} selected ${selectedItems.size === 1 ? 'item' : 'items'}?`
      )
    ) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedItems).map((id) => removeFromOffline(id))
      );
      setSelectedItems(new Set());
      await loadData();
    } catch (error) {
      console.error('Failed to remove selected items:', error);
    }
  };

  const getTypeIcon = (type: OfflineItem['type']) => {
    switch (type) {
      case 'media':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        );
      case 'course':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        );
      case 'lesson':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Loading offline content...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Offline Content
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Manage content downloaded for offline viewing
        </p>
      </div>

      {/* Status Card */}
      {status && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  status.isOnline ? 'bg-green-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {status.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {status.offlineItemsCount}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Offline items
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {formatBytes(status.storageUsed)}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Storage used
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {formatBytes(status.storageQuota)}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Storage quota
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {selectedItems.size > 0 && (
          <button
            onClick={handleRemoveSelected}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Remove Selected ({selectedItems.size})
          </button>
        )}

        <button
          onClick={handleCleanup}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
        >
          Cleanup Expired
        </button>

        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-700 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            No offline content
          </h3>
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">
            Download content from media and courses to access offline
          </p>
          <Link
            href="/media"
            className="inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            Browse Media
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-amber-500 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-amber-500"
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => handleToggleSelect(item.id)}
                className="h-4 w-4 rounded border-neutral-300 text-amber-500 focus:ring-amber-500"
              />

              {/* Icon */}
              <div className="flex-shrink-0 text-amber-600 dark:text-amber-400">
                {getTypeIcon(item.type)}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)} •{' '}
                  Downloaded{' '}
                  {new Date(item.downloadedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={item.url}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
                >
                  View
                </Link>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
