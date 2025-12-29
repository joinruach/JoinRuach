'use client';

import PlatformStatusIcon from './PlatformStatusIcon';

interface PublishingStatusCardProps {
  title: string;
  mediaItemId: number;
  publishStatus?: Record<string, {
    status: 'success' | 'failed' | 'pending';
    timestamp?: string;
    error?: string;
  }>;
  onRetry?: (platform: string) => void;
}

const PLATFORMS = [
  'YouTube',
  'Facebook',
  'Instagram',
  'X',
  'Patreon',
  'Rumble',
  'Locals',
  'TruthSocial',
];

export default function PublishingStatusCard({
  title,
  mediaItemId,
  publishStatus = {},
  onRetry,
}: PublishingStatusCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h3 className="font-medium text-gray-900 dark:text-white mb-4">{title}</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PLATFORMS.map((platform) => {
          const platformKey = platform.toLowerCase().replace(' ', '');
          const status = publishStatus[platformKey];

          const platformStatus = status
            ? status.status
            : 'not-configured';

          return (
            <div
              key={platform}
              className="flex flex-col items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <PlatformStatusIcon status={platformStatus} platform={platformKey} />
              <div className="text-xs font-medium text-gray-900 dark:text-white text-center">
                {platform}
              </div>

              {status?.timestamp && (
                <div className="text-xs text-gray-500">
                  {new Date(status.timestamp).toLocaleTimeString()}
                </div>
              )}

              {status?.status === 'failed' && onRetry && (
                <button
                  onClick={() => onRetry(platformKey)}
                  className="text-xs text-ruachGold hover:underline"
                >
                  Retry
                </button>
              )}

              {status?.error && (
                <div className="text-xs text-red-600 dark:text-red-400 text-center">
                  {status.error.substring(0, 50)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
