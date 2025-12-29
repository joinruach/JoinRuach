import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getRecentMediaItems } from '@/lib/strapi-admin';
import PublishingStatusCard from '@/components/studio/PublishingStatusCard';
import { retryPublishAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function PublishingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/publishing`);
  }

  // Fetch published media items
  const items = await getRecentMediaItems(session.strapiJwt, 50);
  const publishedItems = items.filter((item) => item.attributes?.releasedAt);

  const handleRetry = async (id: number, platform: string) => {
    'use server';
    await retryPublishAction(id, platform);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Publishing Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track multi-platform publishing status and retry failed publishes
        </p>
      </div>

      {/* Publishing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="text-sm text-gray-600 dark:text-gray-400">Published Items</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {publishedItems.length}
          </div>
        </div>
      </div>

      {/* Publishing Status Cards */}
      {publishedItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">📭</div>
          <p>No published content yet. Upload and publish content to see status here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {publishedItems.map((item) => (
            <PublishingStatusCard
              key={item.id}
              title={item.attributes?.title || 'Untitled'}
              mediaItemId={item.id}
              publishStatus={(item.attributes as any)?.publishStatus}
              onRetry={(platform) => handleRetry(item.id, platform)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
