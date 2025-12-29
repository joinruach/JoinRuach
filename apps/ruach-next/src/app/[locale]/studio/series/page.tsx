import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllSeriesForAdmin } from '@/lib/strapi-admin';
import Link from 'next/link';
import { deleteSeriesAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function SeriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/series`);
  }

  const seriesList = await getAllSeriesForAdmin(session.strapiJwt);

  const handleDelete = async (id: number) => {
    'use server';
    await deleteSeriesAction(id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Series Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Organize your content into series and collections
          </p>
        </div>
        <Link
          href={`/${locale}/studio/series/new`}
          className="px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 font-medium"
        >
          + Create Series
        </Link>
      </div>

      {/* Series List */}
      {seriesList.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="text-6xl mb-4">📖</div>
          <p>No series yet. Create your first series to organize content.</p>
          <Link
            href={`/${locale}/studio/series/new`}
            className="inline-block mt-4 px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Create Series
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seriesList.map((series) => (
            <div
              key={series.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {series.attributes?.title || 'Untitled'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {series.attributes?.slug}
              </p>
              {series.attributes?.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                  {series.attributes.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/${locale}/studio/series/${series.id}/edit`}
                  className="text-sm text-ruachGold hover:underline"
                >
                  Edit
                </Link>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this series?')) {
                      handleDelete(series.id);
                    }
                  }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
