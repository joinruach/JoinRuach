'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { retryPublishAction } from '@/app/[locale]/studio/publishing/actions';

interface PlatformJob {
  id: string;
  platform: string;
  state: string;
  attemptsMade: number;
  timestamp?: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'X',
  patreon: 'Patreon',
  rumble: 'Rumble',
  locals: 'Locals',
  truthsocial: 'Truth Social',
};

function getStateStyle(state: string) {
  switch (state) {
    case 'completed': return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' };
    case 'failed': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' };
    case 'active': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' };
    case 'delayed': return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' };
    case 'waiting': return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' };
    default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500' };
  }
}

interface Props {
  mediaItemId: number;
  jobs: PlatformJob[];
  locale: string;
}

export default function PublishDetailClient({ mediaItemId, jobs, locale }: Props) {
  const router = useRouter();
  const [retrying, setRetrying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async (platform: string) => {
    setRetrying(platform);
    setError(null);

    const result = await retryPublishAction(mediaItemId, platform);

    if (!result.success) {
      setError(result.error || 'Failed to retry');
    }

    setRetrying(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Per-platform cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map((job) => {
          const style = getStateStyle(job.state);
          const label = PLATFORM_LABELS[job.platform] || job.platform;

          return (
            <div
              key={job.id}
              className={`rounded-lg p-6 shadow border ${style.bg} border-gray-200 dark:border-gray-700`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {label}
                </h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.text}`}>
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  {job.state}
                </span>
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Attempts</dt>
                  <dd className="text-gray-900 dark:text-white">{job.attemptsMade}</dd>
                </div>

                {job.timestamp && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {new Date(job.timestamp).toLocaleString()}
                    </dd>
                  </div>
                )}

                {job.processedOn && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Started</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {new Date(job.processedOn).toLocaleString()}
                    </dd>
                  </div>
                )}

                {job.finishedOn && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Finished</dt>
                    <dd className="text-gray-900 dark:text-white">
                      {new Date(job.finishedOn).toLocaleString()}
                    </dd>
                  </div>
                )}

                {job.failedReason && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 rounded text-red-700 dark:text-red-400 text-xs">
                    <span className="font-medium">Error:</span> {job.failedReason}
                  </div>
                )}
              </dl>

              {job.state === 'failed' && (
                <button
                  onClick={() => handleRetry(job.platform)}
                  disabled={retrying === job.platform}
                  className="mt-4 w-full px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retrying === job.platform ? 'Retrying...' : 'Retry'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No platform jobs found for this media item.</p>
        </div>
      )}
    </div>
  );
}
