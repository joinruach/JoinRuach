import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { InboxItem } from '@/lib/studio/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sessions - Ruach Studio',
  description: 'Manage recording sessions and content uploads',
};

/**
 * Fetch all sessions (both multi-cam and uploads)
 * For Phase 4, this is a placeholder - real implementation would fetch from session API
 */
async function fetchAllSessions(jwt: string): Promise<InboxItem[]> {
  // TODO: Implement session fetching when API is ready
  // This would combine:
  // - Multi-camera recording sessions
  // - Individual uploads
  // - Ingestion versions
  return [];
}

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/sessions`);
  }

  const sessions = await fetchAllSessions(session.strapiJwt);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sessions
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            All recording sessions and content uploads
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/${locale}/studio/ingestion/upload`}
            className="px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            + Upload Content
          </Link>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={`/${locale}/studio/sessions/ingest`}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">📥</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-ruachGold transition-colors">
              →
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Ingestion Queue
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review and approve uploaded content
          </p>
        </Link>

        <Link
          href={`/${locale}/studio/ingestion/upload`}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">📤</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-ruachGold transition-colors">
              →
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Upload Content
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload new scripture, canon, or library content
          </p>
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow opacity-50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🎬</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Soon
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Multi-Cam Sessions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage multi-camera recording sessions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {sessions.length}
              </p>
            </div>
            <div className="text-4xl">🎬</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {sessions.filter((s) => s.status === 'processing').length}
              </p>
            </div>
            <div className="text-4xl">⚡</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {sessions.filter((s) => s.status === 'reviewing').length}
              </p>
            </div>
            <div className="text-4xl">👀</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {sessions.filter((s) => s.status === 'completed').length}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          All Sessions
        </h2>

        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-lg mb-2">No sessions yet</p>
            <p className="text-sm mb-4">
              Upload content or create a multi-cam session to get started
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href={`/${locale}/studio/ingestion/upload`}
                className="inline-block px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Upload Content
              </Link>
              <Link
                href={`/${locale}/studio/sessions/ingest`}
                className="inline-block px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                View Ingestion Queue
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Sessions list will appear here once API is connected</p>
          </div>
        )}
      </div>
    </div>
  );
}
