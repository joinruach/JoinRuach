import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Edit Decisions - Ruach Studio',
  description: 'Manage edit decision lists and video editing workflows',
};

export default async function EditDecisionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/edits`);
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
        <span>›</span>
        <span className="text-gray-900 dark:text-white">Edit Decisions</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Decisions
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage edit decision lists (EDLs) and video editing workflows
          </p>
        </div>

        <Link
          href={`/${locale}/studio/edits/new`}
          className="px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          + Create EDL
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total EDLs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                0
              </p>
            </div>
            <div className="text-4xl">✂️</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                0
              </p>
            </div>
            <div className="text-4xl">✏️</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ready to Render</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                0
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Archived</p>
              <p className="text-3xl font-bold text-gray-600 mt-1">
                0
              </p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>
      </div>

      {/* EDL List Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Edit Decision Lists
        </h2>

        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">✂️</div>
          <p className="text-lg mb-2">No edit decisions yet</p>
          <p className="text-sm mb-4">
            Create your first EDL to start editing video content
          </p>
          <Link
            href={`/${locale}/studio/edits/new`}
            className="inline-block px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Create EDL
          </Link>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              About Edit Decisions
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-200">
              Edit Decision Lists (EDLs) define how raw footage should be edited together.
              Create EDLs to specify cuts, transitions, and sequencing before rendering final videos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
