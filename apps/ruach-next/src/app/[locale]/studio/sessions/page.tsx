import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { listSessions } from '@/lib/studio/sessions';
import type { Session } from '@/lib/studio/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Sessions - Ruach Studio',
  description: 'Manage recording sessions and content uploads',
};

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: Session['status'] }) {
  const config = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    ingesting: { label: 'Ingesting', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    'needs-review': { label: 'Needs Review', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    syncing: { label: 'Syncing', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    synced: { label: 'Synced', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    editing: { label: 'Editing', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' },
    rendering: { label: 'Rendering', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    published: { label: 'Published', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    archived: { label: 'Archived', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
  };

  const { label, color } = config[status] || config.draft;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
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

  const sessions = await listSessions(session.strapiJwt);

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

        <Link
          href={`/${locale}/studio/sessions/new`}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🎬</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-ruachGold transition-colors">
              →
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Multi-Cam Sessions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create new multi-camera recording session
          </p>
        </Link>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingesting</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {sessions.filter((s) => s.status === 'ingesting' || s.status === 'syncing').length}
              </p>
            </div>
            <div className="text-4xl">⚡</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Needs Review</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {sessions.filter((s) => s.status === 'needs-review').length}
              </p>
            </div>
            <div className="text-4xl">👀</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ready</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {sessions.filter((s) => s.status === 'synced' || s.status === 'editing').length}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            All Sessions
          </h2>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-lg mb-2">No sessions yet</p>
            <p className="text-sm mb-4">
              Create a multi-camera session to get started
            </p>
            <Link
              href={`/${locale}/studio/sessions/new`}
              className="inline-block px-6 py-3 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium"
            >
              + Create Session
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Recording Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cameras
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {s.title}
                        </div>
                        {s.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {s.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(s.recordingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {s.anchorAngle && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-ruachGold bg-opacity-20 text-ruachGold">
                            {s.anchorAngle} (anchor)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Link
                        href={`/${locale}/studio/sessions/${s.id}`}
                        className="text-ruachGold hover:text-opacity-80 font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
