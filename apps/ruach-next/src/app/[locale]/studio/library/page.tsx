import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Library - Ruach Studio',
  description: 'Manage content library and series',
};

export default async function LibraryHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/library`);
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Library
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your content catalog and organize series
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href={`/${locale}/studio/library/content`}
          className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-5xl">📚</div>
            <div className="text-lg text-gray-500 dark:text-gray-400 group-hover:text-ruachGold transition-colors">
              →
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Content Library
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and manage all media items
          </p>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            View, edit, and organize your content catalog
          </div>
        </Link>

        <Link
          href={`/${locale}/studio/library/series`}
          className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-5xl">📖</div>
            <div className="text-lg text-gray-500 dark:text-gray-400 group-hover:text-ruachGold transition-colors">
              →
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Series Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create and organize content series
          </p>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Group related content into series
          </div>
        </Link>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Library Overview
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              The library is your central catalog for all published and draft content.
              Organize media items into series to help viewers discover related teachings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
