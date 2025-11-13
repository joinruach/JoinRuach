"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  downloadForOffline,
  removeFromOffline,
  isAvailableOffline,
  OfflineItem,
} from '@/lib/offline/offlineManager';

interface OfflineDownloadButtonProps {
  id: string;
  type: OfflineItem['type'];
  title: string;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * OfflineDownloadButton Component
 *
 * Allows users to download content for offline viewing.
 * Shows different states: downloadable, downloading, downloaded.
 *
 * Features:
 * - Download content for offline use
 * - Remove downloaded content
 * - Show download status
 * - Handle errors
 *
 * @example
 * ```tsx
 * <OfflineDownloadButton
 *   id="media-123"
 *   type="media"
 *   title="Understanding the Holy Spirit"
 *   url="/media/understanding-holy-spirit"
 *   thumbnailUrl="/images/thumb.jpg"
 *   variant="button"
 * />
 * ```
 */
export default function OfflineDownloadButton({
  id,
  type,
  title,
  url,
  thumbnailUrl,
  metadata,
  variant = 'button',
  size = 'md',
}: OfflineDownloadButtonProps) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkOfflineStatus = useCallback(async () => {
    const available = await isAvailableOffline(id);
    setIsDownloaded(available);
  }, [id]);

  useEffect(() => {
    checkOfflineStatus();
  }, [checkOfflineStatus]);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await downloadForOffline({
        id,
        type,
        title,
        url,
        thumbnailUrl,
        metadata,
      });

      setIsDownloaded(true);
    } catch (err) {
      console.error('Download failed:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await removeFromOffline(id);
      setIsDownloaded(false);
    } catch (err) {
      console.error('Remove failed:', err);
      setError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={isDownloaded ? handleRemove : handleDownload}
          disabled={isLoading}
          className="rounded-full p-2 transition hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
          aria-label={
            isDownloaded ? 'Remove from offline' : 'Download for offline'
          }
          title={
            isDownloaded ? 'Remove from offline' : 'Download for offline'
          }
        >
          {isLoading ? (
            <svg
              className={`${iconSizeClasses[size]} animate-spin text-amber-500`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ) : isDownloaded ? (
            <svg
              className={`${iconSizeClasses[size]} text-green-600 dark:text-green-400`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg
              className={`${iconSizeClasses[size]} text-neutral-600 dark:text-neutral-400`}
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
          )}
        </button>

        {error && (
          <div className="absolute left-full top-0 ml-2 w-48 rounded-lg bg-red-600 px-3 py-2 text-xs text-white shadow-lg">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={isDownloaded ? handleRemove : handleDownload}
        disabled={isLoading}
        className={`flex items-center gap-2 rounded-lg font-medium transition disabled:opacity-50 ${sizeClasses[size]} ${
          isDownloaded
            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
            : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'
        }`}
      >
        {isLoading ? (
          <>
            <svg
              className={`${iconSizeClasses[size]} animate-spin`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isDownloaded ? 'Removing...' : 'Downloading...'}</span>
          </>
        ) : isDownloaded ? (
          <>
            <svg
              className={iconSizeClasses[size]}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Available Offline</span>
          </>
        ) : (
          <>
            <svg
              className={iconSizeClasses[size]}
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
            <span>Download</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
