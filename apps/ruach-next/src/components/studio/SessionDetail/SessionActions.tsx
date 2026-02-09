'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Session } from '@/lib/studio';
import { triggerSync } from '@/lib/studio';

export default function SessionActions({
  session,
  locale,
  authToken,
}: {
  session: Session;
  locale: string;
  authToken: string;
}) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionSlug = session.documentId || session.id.toString();

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      await triggerSync(sessionSlug, authToken, session.anchorAngle);
      // Refresh the page to show updated status
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to trigger sync'
      );
      setIsSyncing(false);
    }
  };

  // Determine which actions to show based on session status
  const actions = getActionsForStatus(session.status);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Next Steps
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {actions.map((action) => {
          if (action.type === 'link') {
            return (
              <Link
                key={action.label}
                href={action.href!}
                className="block w-full px-6 py-3 bg-ruachGold text-ruachDark text-center rounded-lg hover:bg-opacity-90 transition-colors font-medium"
              >
                {action.label}
              </Link>
            );
          }

          if (action.type === 'button') {
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={isSyncing}
                className="w-full px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? 'Processing...' : action.label}
              </button>
            );
          }

          return null;
        })}

        {actions.length === 0 && (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">
            {getStatusMessage(session.status)}
          </p>
        )}
      </div>
    </div>
  );

  function getActionsForStatus(status: string) {
    switch (status) {
      case 'needs-review':
        return [
          {
            type: 'link' as const,
            label: 'Review Sync Results',
            href: `/${locale}/studio/sessions/${sessionSlug}/sync-review`,
          },
        ];

      case 'synced':
        return [
          {
            type: 'link' as const,
            label: 'Generate Transcript',
            href: `/${locale}/studio/sessions/${sessionSlug}/transcript`,
          },
        ];

      case 'editing':
        return [
          {
            type: 'link' as const,
            label: 'Edit Timeline',
            href: `/${locale}/studio/sessions/${sessionSlug}/edl`,
          },
        ];

      case 'ingesting':
        // Check if transcoding is complete and sync can be triggered
        return [
          {
            type: 'button' as const,
            label: 'Trigger Sync Computation',
            onClick: handleTriggerSync,
          },
        ];

      default:
        return [];
    }
  }

  function getStatusMessage(status: string): string {
    switch (status) {
      case 'draft':
        return 'Session is being created...';
      case 'ingesting':
        return 'Videos are being transcoded. This may take several minutes.';
      case 'syncing':
        return 'Sync computation in progress...';
      case 'rendering':
        return 'Final video is being rendered...';
      case 'published':
        return 'Session is published and ready.';
      case 'archived':
        return 'Session is archived.';
      default:
        return 'Session is being processed.';
    }
  }
}
