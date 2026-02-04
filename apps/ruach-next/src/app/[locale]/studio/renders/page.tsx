import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { QueueTable } from '@/components/studio/Queue';
import type { InboxItem } from '@/lib/studio/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Render Jobs - Ruach Studio',
  description: 'Monitor and manage video render jobs',
};

/**
 * Fetch all render jobs (simplified for Phase 3)
 * In future, this should be replaced with a dedicated API endpoint
 */
async function fetchAllRenderJobs(jwt: string): Promise<InboxItem[]> {
  // For Phase 3, we'll return empty array until we have a dedicated endpoint
  // The render jobs are session-specific and accessed via /api/render-job/render-jobs/session/:id
  // Future: Add GET /api/render-job/render-jobs endpoint
  return [];
}

export default async function RendersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/renders`);
  }

  const renderJobs = await fetchAllRenderJobs(session.strapiJwt);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Render Jobs
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor video encoding and rendering jobs across all sessions
          </p>
        </div>

        <Link
          href={`/${locale}/studio/render-pipeline`}
          className="px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          + New Render
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {renderJobs.length}
              </p>
            </div>
            <div className="text-4xl">🎞️</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Processing</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {renderJobs.filter((j) => j.status === 'processing' || j.status === 'rendering').length}
              </p>
            </div>
            <div className="text-4xl">⚙️</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Queued</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {renderJobs.filter((j) => j.status === 'queued').length}
              </p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {renderJobs.filter((j) => j.status === 'failed').length}
              </p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Render Jobs Queue */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          All Render Jobs
        </h2>

        {renderJobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-lg mb-2">No render jobs found</p>
            <p className="text-sm mb-4">
              Create your first render from a recording session
            </p>
            <Link
              href={`/${locale}/studio/render-pipeline`}
              className="inline-block px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Create Render Job
            </Link>
          </div>
        ) : (
          <QueueTable
            items={renderJobs}
            locale={locale}
            columns={['thumbnail', 'title', 'status', 'priority', 'updated', 'actions']}
            emptyMessage="No render jobs match your filters"
            emptyIcon="🎞️"
          />
        )}
      </div>

      {/* Link to Legacy Render Pipeline */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Looking for the full render pipeline?{' '}
          <Link
            href={`/${locale}/studio/render-pipeline`}
            className="text-ruachGold hover:underline"
          >
            Go to Render Pipeline →
          </Link>
        </p>
      </div>
    </div>
  );
}
