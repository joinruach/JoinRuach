import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import IngestionInbox from '@/components/studio/IngestionInbox';

export const dynamic = 'force-dynamic';

export default async function IngestionConsolePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/ingestion`);
  }

  return (
    <div className="space-y-6">
      {/* Migration Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              New Ingestion Queue Available
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-200">
              The ingestion workflow has been redesigned with server-side rendering for 50% faster loading and better UX.{' '}
              <Link
                href={`/${locale}/studio/sessions/ingest`}
                className="font-medium underline hover:no-underline"
              >
                Try the new Ingest Queue →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Ingestion Console
          <span className="ml-3 text-sm font-normal text-gray-500 dark:text-gray-400">(Legacy)</span>
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Upload and review scripture, canon, and library content for ingestion.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href={`/${locale}/studio/ingestion/upload`}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">📤</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upload</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                New Content
              </p>
            </div>
          </div>
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⏳</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-xl font-semibold text-yellow-600">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔄</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Processing</p>
              <p className="text-xl font-semibold text-blue-600">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-xl font-semibold text-green-600">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inbox */}
      <IngestionInbox locale={locale} />
    </div>
  );
}
