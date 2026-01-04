import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getRecentMediaItems } from '@/lib/strapi-admin';
import Link from 'next/link';
import Image from 'next/image';
import { imgUrl } from '@/lib/strapi';

export const dynamic = 'force-dynamic';

export default async function StudioDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio`);
  }

  // Fetch recent uploads
  const recentItems = await getRecentMediaItems(session.strapiJwt, 10);

  // Calculate publishing stats (from recent items)
  const publishedCount = recentItems.filter((item) => item.attributes?.releasedAt).length;
  const draftCount = recentItems.filter((item) => !item.attributes?.releasedAt).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Studio Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back! Manage your content and track publishing status.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Content</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {recentItems.length}
              </p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Published</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{publishedCount}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Drafts</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{draftCount}</p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={`/${locale}/studio/upload`}
            className="flex items-center gap-3 p-4 rounded-lg bg-ruachGold text-ruachDark hover:bg-opacity-90 transition-colors font-medium"
          >
            <span className="text-2xl">📤</span>
            <span>Upload Content</span>
          </Link>

          <Link
            href={`/${locale}/studio/content`}
            className="flex items-center gap-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="text-2xl">📚</span>
            <span>View All Content</span>
          </Link>

          <Link
            href={`/${locale}/studio/publishing`}
            className="flex items-center gap-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="text-2xl">🚀</span>
            <span>Publishing Status</span>
          </Link>

          <Link
            href={`/${locale}/studio/series`}
            className="flex items-center gap-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="text-2xl">📖</span>
            <span>Manage Series</span>
          </Link>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Uploads
          </h2>
          <Link
            href={`/${locale}/studio/content`}
            className="text-sm text-ruachGold hover:underline"
          >
            View All →
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">📭</div>
            <p>No content yet. Upload your first media item to get started!</p>
            <Link
              href={`/${locale}/studio/upload`}
              className="inline-block mt-4 px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Upload Now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentItems.map((item) => {
              const title = item.attributes?.title || 'Untitled';
              const thumbnail = item.attributes?.thumbnail?.data?.attributes?.url;
              const thumbnailSrc = thumbnail ? imgUrl(thumbnail) : null;
              const isPublished = Boolean(item.attributes?.releasedAt);
              const contentType = item.attributes?.type || 'unknown';
              const speakers = item.attributes?.speakers?.data || [];

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {/* Thumbnail */}
                  {thumbnailSrc ? (
                    <Image
                      src={thumbnailSrc}
                      alt={title}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl">
                      🎬
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className="capitalize">{contentType}</span>
                      {speakers.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{speakers[0]?.attributes?.displayName || speakers[0]?.attributes?.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPublished ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        Draft
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <Link
                    href={`/${locale}/studio/content/${item.id}/edit`}
                    className="text-sm text-ruachGold hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
