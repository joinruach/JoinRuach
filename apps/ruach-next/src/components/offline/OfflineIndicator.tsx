"use client";

import { useEffect, useState } from 'react';
import { processSyncQueue } from '@/lib/offline/backgroundSync';

/**
 * OfflineIndicator Component
 *
 * Displays a banner when user goes offline and manages background sync
 * when connection is restored.
 *
 * Features:
 * - Detects online/offline status
 * - Shows notification banner
 * - Auto-syncs queued requests when online
 * - Displays sync progress
 *
 * @example
 * ```tsx
 * // Add to root layout
 * <OfflineIndicator />
 * ```
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      setShowBanner(true);

      // Attempt to sync queued requests
      setIsSyncing(true);
      setSyncMessage('Syncing pending changes...');

      try {
        const result = await processSyncQueue();

        if (result.successful > 0 || result.failed > 0) {
          setSyncMessage(
            `Synced ${result.successful} ${result.successful === 1 ? 'item' : 'items'}${
              result.failed > 0 ? `, ${result.failed} failed` : ''
            }`
          );
        } else {
          setSyncMessage('Back online');
        }

        // Hide banner after a delay
        setTimeout(() => {
          setShowBanner(false);
        }, 5000);
      } catch (error) {
        console.error('Sync error:', error);
        setSyncMessage('Sync failed');
        setTimeout(() => {
          setShowBanner(false);
        }, 3000);
      } finally {
        setIsSyncing(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setSyncMessage('');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && isOnline) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-300 ${
        showBanner ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg ${
          isOnline
            ? 'bg-green-600 text-white'
            : 'bg-amber-600 text-white'
        }`}
      >
        {/* Icon */}
        {isOnline ? (
          isSyncing ? (
            <svg
              className="h-5 w-5 animate-spin"
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
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
            />
          </svg>
        )}

        {/* Message */}
        <div>
          <p className="text-sm font-semibold">
            {isOnline ? syncMessage || 'Back online' : 'You are offline'}
          </p>
          {!isOnline && (
            <p className="text-xs opacity-90">
              Your changes will be saved when connection is restored
            </p>
          )}
        </div>

        {/* Close button */}
        {!isSyncing && (
          <button
            onClick={() => setShowBanner(false)}
            className="ml-2 flex-shrink-0 rounded-full p-1 transition hover:bg-white/20"
            aria-label="Close notification"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
