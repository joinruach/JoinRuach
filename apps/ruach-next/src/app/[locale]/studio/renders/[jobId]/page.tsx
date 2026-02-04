import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { RenderJobMonitor } from '@/components/studio/RenderPipeline/RenderJobMonitor';

export const dynamic = 'force-dynamic';

export default async function RenderJobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; jobId: string }>;
}) {
  const { locale, jobId } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/renders/${jobId}`);
  }

  return (
    <div className="space-y-6">
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
          href={`/${locale}/studio/renders`}
          className="hover:text-ruachGold transition-colors"
        >
          Renders
        </Link>
        <span>›</span>
        <span className="text-gray-900 dark:text-white">Job {jobId}</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Render Job Details
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor progress and download completed renders
        </p>
      </div>

      {/* Render Job Monitor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <RenderJobMonitor
          jobId={jobId}
          onComplete={() => {
            // Job completed - could redirect or show success message
            console.log(`Render job ${jobId} completed`);
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/${locale}/studio/renders`}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          ← Back to All Renders
        </Link>
        <Link
          href={`/${locale}/studio/render-pipeline`}
          className="px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          Create Another Render
        </Link>
      </div>
    </div>
  );
}
