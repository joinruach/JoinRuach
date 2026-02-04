import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Series Management - Ruach Studio',
  description: 'Create and organize content series',
};

export default async function SeriesLibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/library/series`);
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
        <Link
          href={`/${locale}/studio/library`}
          className="hover:text-ruachGold transition-colors"
        >
          Library
        </Link>
        <span>›</span>
        <span className="text-gray-900 dark:text-white">Series</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Series Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create and organize content into series
          </p>
        </div>

        <Link
          href={`/${locale}/studio/series/new`}
          className="px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          + Create Series
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Series</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                0
              </p>
            </div>
            <div className="text-4xl">📖</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
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

      {/* Series List Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          All Series
        </h2>

        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">📖</div>
          <p className="text-lg mb-2">No series yet</p>
          <p className="text-sm mb-4">
            Create your first series to organize related content
          </p>
          <Link
            href={`/${locale}/studio/series/new`}
            className="inline-block px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Create Series
          </Link>
        </div>
      </div>

      {/* Legacy Link */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Looking for the legacy series view?{' '}
          <Link
            href={`/${locale}/studio/series`}
            className="text-ruachGold hover:underline"
          >
            View legacy series page →
          </Link>
        </p>
      </div>
    </div>
  );
}
