import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { InboxItem } from '@/lib/studio/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Publishing Jobs - Ruach Studio',
  description: 'Monitor content distribution to platforms',
};

/**
 * Fetch publishing jobs
 * For Phase 5, this is a placeholder - real implementation would fetch from publishing API
 */
async function fetchPublishingJobs(jwt: string): Promise<InboxItem[]> {
  // TODO: Implement when publishing API is ready
  // This would fetch jobs for:
  // - YouTube uploads
  // - Facebook posts
  // - Instagram posts
  // - Platform distribution status
  return [];
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

  const publishJobs = await fetchPublishingJobs(session.strapiJwt);

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
        <span>›</span>
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
                {publishJobs.length}
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
                {publishJobs.filter((j) => j.status === 'processing').length}
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
                {publishJobs.filter((j) => j.status === 'scheduled').length}
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
                {publishJobs.filter((j) => j.status === 'failed').length}
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
          {['YouTube', 'Facebook', 'Instagram', 'X', 'Patreon', 'Rumble', 'Locals', 'Truth Social'].map(
            (platform) => (
              <div
                key={platform}
                className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="text-3xl">
                  {platform === 'YouTube' && '📺'}
                  {platform === 'Facebook' && '📘'}
                  {platform === 'Instagram' && '📷'}
                  {platform === 'X' && '🐦'}
                  {platform === 'Patreon' && '🎨'}
                  {platform === 'Rumble' && '📹'}
                  {platform === 'Locals' && '🏘️'}
                  {platform === 'Truth Social' && '🗽'}
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white text-center">
                  {platform}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  0 jobs
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Publishing Jobs Queue */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Publishing Queue
        </h2>

        {publishJobs.length === 0 ? (
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
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Publishing jobs will appear here once API is connected</p>
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
            View legacy publishing page →
          </Link>
        </p>
      </div>
    </div>
  );
}
