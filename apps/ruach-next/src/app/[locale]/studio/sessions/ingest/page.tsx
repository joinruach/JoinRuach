import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { QueueTable } from '@/components/studio/Queue';
import type { InboxItem, WorkflowStatus } from '@/lib/studio/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ingestion Queue - Ruach Studio',
  description: 'Review and approve content uploads',
};

interface Version {
  versionId: string;
  sourceId: string;
  contentType: 'scripture' | 'canon' | 'library';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reviewing';
  progress: number;
  qaMetrics?: {
    totalWorks?: number;
    totalVerses?: number;
    validationPassed?: boolean;
    reviewStatus?: string;
  };
  createdAt: string;
  completedAt?: string;
}

/**
 * Fetch ingestion versions and map to InboxItems
 */
async function fetchIngestionQueue(jwt: string): Promise<InboxItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/ingestion/versions`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[Ingestion Queue] Failed to fetch versions:', response.status);
      return [];
    }

    const data = await response.json();
    const versions: Version[] = data.versions || [];

    // Map versions to InboxItems
    return versions.map((version) => {
      const contentTypeIcons = {
        scripture: '📖',
        canon: '📚',
        library: '📗',
      };

      return {
        id: `ingest-${version.versionId}`,
        category: 'ingest' as const,
        entityType: 'upload' as const,
        entityId: version.versionId,

        title: `${version.contentType.charAt(0).toUpperCase() + version.contentType.slice(1)}: ${version.sourceId}`,
        subtitle: version.qaMetrics?.totalVerses
          ? `${version.qaMetrics.totalVerses.toLocaleString()} verses`
          : version.qaMetrics?.totalWorks
          ? `${version.qaMetrics.totalWorks} works`
          : undefined,
        thumbnailUrl: undefined,
        icon: contentTypeIcons[version.contentType],

        status: version.status as WorkflowStatus,
        priority:
          version.status === 'failed'
            ? ('urgent' as const)
            : version.status === 'reviewing'
            ? ('high' as const)
            : version.status === 'processing'
            ? ('normal' as const)
            : ('low' as const),
        reason:
          version.status === 'failed'
            ? 'Ingestion failed and needs attention'
            : version.status === 'reviewing'
            ? 'Ready for operator review and approval'
            : version.status === 'processing'
            ? `Processing... ${version.progress}% complete`
            : version.status === 'completed'
            ? 'Ingestion completed successfully'
            : 'Waiting to start processing',

        availableActions:
          version.status === 'reviewing'
            ? ['review', 'approve', 'reject']
            : version.status === 'failed'
            ? ['retry', 'cancel']
            : version.status === 'pending'
            ? ['review', 'cancel']
            : [],
        primaryAction:
          version.status === 'reviewing'
            ? ('approve' as const)
            : version.status === 'failed'
            ? ('retry' as const)
            : ('review' as const),

        createdAt: version.createdAt,
        updatedAt: version.completedAt || version.createdAt,
      };
    });
  } catch (error) {
    console.error('[Ingestion Queue] Error fetching versions:', error);
    return [];
  }
}

export default async function IngestionQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/sessions/ingest`);
  }

  const ingestionItems = await fetchIngestionQueue(session.strapiJwt);

  // Calculate stats
  const stats = {
    total: ingestionItems.length,
    pending: ingestionItems.filter((i) => i.status === 'pending').length,
    processing: ingestionItems.filter((i) => i.status === 'processing').length,
    reviewing: ingestionItems.filter((i) => i.status === 'reviewing').length,
    failed: ingestionItems.filter((i) => i.status === 'failed').length,
    completed: ingestionItems.filter((i) => i.status === 'completed').length,
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
          href={`/${locale}/studio/sessions`}
          className="hover:text-ruachGold transition-colors"
        >
          Sessions
        </Link>
        <span>›</span>
        <span className="text-gray-900 dark:text-white">Ingest</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ingestion Queue
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review and approve scripture, canon, and library content uploads
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.total}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">
            {stats.pending}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-xs text-gray-600 dark:text-gray-400">Processing</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.processing}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-xs text-gray-600 dark:text-gray-400">Reviewing</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {stats.reviewing}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-xs text-gray-600 dark:text-gray-400">Failed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {stats.failed}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {stats.completed}
          </p>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <QueueTable
          items={ingestionItems}
          locale={locale}
          columns={['thumbnail', 'title', 'status', 'priority', 'reason', 'updated', 'actions']}
          emptyMessage="No ingestion items found. Upload content to get started."
          emptyIcon="📥"
        />
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Items in the reviewing state require operator approval before being published.{' '}
          <Link
            href={`/${locale}/studio/ingestion`}
            className="text-ruachGold hover:underline"
          >
            View legacy ingestion console →
          </Link>
        </p>
      </div>
    </div>
  );
}
