import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getRecentMediaItems } from '@/lib/strapi-admin';
import { QueueTable } from '@/components/studio/Queue';
import type { InboxItem, WorkflowStatus } from '@/lib/studio/types';
import type { MediaItemEntity } from '@/lib/types/strapi-types';
import { imgUrl } from '@/lib/strapi';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Content Library - Ruach Studio',
  description: 'Browse and manage all media items',
};

/**
 * Map MediaItemEntity to InboxItem for QueueTable
 */
function mapMediaItemToInboxItem(item: MediaItemEntity, locale: string): InboxItem {
  const title = item.attributes?.title || 'Untitled';
  const thumbnail = item.attributes?.thumbnail?.data?.attributes?.url;
  const isPublished = Boolean(item.attributes?.releasedAt);
  const contentType = item.attributes?.type || 'unknown';
  const releasedAt = item.attributes?.releasedAt;

  return {
    id: `media-${item.id}`,
    category: 'library' as const,
    entityType: 'media-item' as const,
    entityId: item.id,

    title,
    subtitle: contentType.charAt(0).toUpperCase() + contentType.slice(1),
    thumbnailUrl: thumbnail || undefined,
    icon: '🎬',

    status: (isPublished ? 'published' : 'draft') as WorkflowStatus,
    priority: 'normal' as const,
    reason: isPublished
      ? `Published ${new Date(releasedAt!).toLocaleDateString()}`
      : 'Draft - not yet published',

    availableActions: ['edit'],
    primaryAction: 'edit' as const,

    createdAt: releasedAt || new Date().toISOString(),
    updatedAt: releasedAt || new Date().toISOString(),
  };
}

export default async function ContentLibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/library/content`);
  }

  // Fetch recent media items
  const mediaItems = await getRecentMediaItems(session.strapiJwt, 100);

  // Map to InboxItems for QueueTable
  const contentItems = mediaItems.map((item) => mapMediaItemToInboxItem(item, locale));

  // Calculate stats
  const stats = {
    total: contentItems.length,
    published: contentItems.filter((i) => i.status === 'published').length,
    draft: contentItems.filter((i) => i.status !== 'published').length,
  };

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
        <span className="text-gray-900 dark:text-white">Content</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Content Library
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Browse and manage all media items in your catalog
          </p>
        </div>

        <Link
          href={`/${locale}/studio/ingestion/upload`}
          className="px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          + Upload Content
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Published</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.published}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Drafts</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {stats.draft}
              </p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <QueueTable
          items={contentItems}
          locale={locale}
          columns={['thumbnail', 'title', 'status', 'updated', 'actions']}
          onAction={(itemId, action) => {
            // Actions handled by QueueTable link behavior
            console.log(`Action ${action} on ${itemId}`);
          }}
          emptyMessage="No content found. Upload your first media item to get started."
          emptyIcon="📚"
        />
      </div>

      {/* Legacy Link */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Looking for the legacy content view?{' '}
          <Link
            href={`/${locale}/studio/content`}
            className="text-ruachGold hover:underline"
          >
            View legacy content page →
          </Link>
        </p>
      </div>
    </div>
  );
}
