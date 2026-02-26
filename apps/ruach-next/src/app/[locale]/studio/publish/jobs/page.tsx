import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Publishing Jobs - Ruach Studio',
  description: 'Monitor content distribution to platforms',
};

interface PublishJob {
  id: string;
  name: string;
  correlationId?: string;
  platform: string;
  mediaItemId?: number;
  mediaItemTitle?: string;
  bullState: string;
  workflowState: string;
  priority: string;
  retryAllowed: boolean;
  attemptsMade: number;
  timestamp?: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
}

interface JobsResponse {
  success: boolean;
  jobs: PublishJob[];
  total: number;
  counts: Record<string, number>;
  pagination: { page: number; limit: number };
}

const PLATFORM_META: Record<string, { emoji: string; label: string }> = {
  youtube: { emoji: '📺', label: 'YouTube' },
  facebook: { emoji: '📘', label: 'Facebook' },
  instagram: { emoji: '📷', label: 'Instagram' },
  x: { emoji: '🐦', label: 'X' },
  patreon: { emoji: '🎨', label: 'Patreon' },
  rumble: { emoji: '📹', label: 'Rumble' },
  locals: { emoji: '🏘️', label: 'Locals' },
  truthsocial: { emoji: '🗽', label: 'Truth Social' },
};

async function fetchPublishingJobs(jwt: string): Promise<JobsResponse> {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

  try {
    const response = await fetch(`${strapiUrl}/api/ruach-publisher/jobs?limit=100`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (!response.ok) {
      return { success: false, jobs: [], total: 0, counts: {}, pagination: { page: 1, limit: 100 } };
    }

    return await response.json();
  } catch {
    return { success: false, jobs: [], total: 0, counts: {}, pagination: { page: 1, limit: 100 } };
  }
}

function getStateColor(workflowState: string): string {
  switch (workflowState) {
    case 'published': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    case 'processing': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    case 'scheduled': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
    case 'queued': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
  }
}

export default async function PublishingJobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/publish/jobs`);
  }

  const data = await fetchPublishingJobs(session.strapiJwt);
  const { jobs, counts } = data;

  // Count jobs per platform
  const platformCounts: Record<string, number> = {};
  for (const job of jobs) {
    platformCounts[job.platform] = (platformCounts[job.platform] || 0) + 1;
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link
          href={`/${locale}/studio`}
          className="hover:text-ruachGold transition-colors"
        >
          Inbox
        </Link>
        <span>&rsaquo;</span>
        <span className="text-gray-900 dark:text-white">Publishing</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Publishing Jobs
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor content distribution to platforms
          </p>
        </div>

        <Link
          href={`/${locale}/studio/library/content`}
          className="px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          Browse Content
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.total}
              </p>
            </div>
            <div className="text-4xl">🚀</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Publishing</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {counts.active || 0}
              </p>
            </div>
            <div className="text-4xl">⚙️</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {(counts.delayed || 0) + (counts.waiting || 0)}
              </p>
            </div>
            <div className="text-4xl">⏰</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {counts.failed || 0}
              </p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Platform Status Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Platform Status
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(PLATFORM_META).map(([key, { emoji, label }]) => (
            <div
              key={key}
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="text-3xl">{emoji}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white text-center">
                {label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {platformCounts[key] || 0} jobs
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Publishing Jobs Queue */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Publishing Queue
        </h2>

        {jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">🚀</div>
            <p className="text-lg mb-2">No publishing jobs found</p>
            <p className="text-sm mb-4">
              Publishing jobs will appear here when content is distributed to platforms
            </p>
            <Link
              href={`/${locale}/studio/library/content`}
              className="inline-block px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Browse Content
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Content</th>
                  <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Platform</th>
                  <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Attempts</th>
                  <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Time</th>
                  <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {jobs.map((job) => {
                  const pm = PLATFORM_META[job.platform] || { emoji: '📡', label: job.platform };
                  return (
                    <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {job.mediaItemTitle || `Item #${job.mediaItemId}`}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1">
                          {pm.emoji} {pm.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStateColor(job.workflowState)}`}>
                          {job.workflowState}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                        {job.attemptsMade}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                        {job.timestamp
                          ? new Date(job.timestamp).toLocaleString()
                          : '—'}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/${locale}/studio/publish/${job.mediaItemId || job.id}`}
                          className="text-ruachGold hover:underline text-xs"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legacy Link */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Looking for the legacy publishing view?{' '}
          <Link
            href={`/${locale}/studio/publishing`}
            className="text-ruachGold hover:underline"
          >
            View legacy publishing page &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
