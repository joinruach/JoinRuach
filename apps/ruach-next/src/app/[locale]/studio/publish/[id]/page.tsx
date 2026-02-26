import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PublishDetailClient from './PublishDetailClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Publishing Detail - Ruach Studio',
  description: 'Per-platform publishing status and controls',
};

interface PlatformJob {
  id: string;
  platform: string;
  state: string;
  attemptsMade: number;
  timestamp?: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
}

interface PublishStatus {
  success: boolean;
  mediaItemId: number;
  totalJobs: number;
  jobs: PlatformJob[];
}

async function fetchPublishStatus(
  mediaItemId: string,
  jwt: string
): Promise<PublishStatus | null> {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

  try {
    const response = await fetch(
      `${strapiUrl}/api/ruach-publisher/status/${mediaItemId}`,
      {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${jwt}` },
      }
    );

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export default async function PublishDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/publish/${id}`);
  }

  const status = await fetchPublishStatus(id, session.strapiJwt);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link href={`/${locale}/studio`} className="hover:text-ruachGold transition-colors">
          Inbox
        </Link>
        <span>&rsaquo;</span>
        <Link href={`/${locale}/studio/publish/jobs`} className="hover:text-ruachGold transition-colors">
          Publishing
        </Link>
        <span>&rsaquo;</span>
        <span className="text-gray-900 dark:text-white">Item #{id}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Publishing Status
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Media Item #{id} &mdash; {status?.totalJobs ?? 0} platform jobs
        </p>
      </div>

      {!status ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow text-center text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-lg mb-2">No publishing data found</p>
          <p className="text-sm">
            This media item has not been published yet, or the publisher queue is not running.
          </p>
        </div>
      ) : (
        <PublishDetailClient
          mediaItemId={parseInt(id, 10)}
          jobs={status.jobs}
          locale={locale}
        />
      )}
    </div>
  );
}
