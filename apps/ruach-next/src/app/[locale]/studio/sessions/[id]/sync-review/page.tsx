import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSession, getSessionAssets } from '@/lib/studio';
import SyncReviewCockpit from '@/components/studio/SyncReview/SyncReviewCockpit';

export const metadata = {
  title: 'Sync Review - Ruach Studio',
  description: 'Review and approve multi-camera sync offsets',
};

export default async function SyncReviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(
      `/${locale}/login?callbackUrl=/${locale}/studio/sessions/${id}/sync-review`
    );
  }

  // Fetch session and assets
  let recordingSession;
  let assets: Awaited<ReturnType<typeof getSessionAssets>> = [];

  try {
    recordingSession = await getSession(id, session.strapiJwt);
  } catch (error) {
    console.error('[Sync Review] Failed to fetch session:', error);
    redirect(`/${locale}/studio/sessions/${id}?error=fetch_failed`);
  }

  try {
    assets = await getSessionAssets(id, session.strapiJwt);
  } catch {
    // Assets endpoint may not exist yet — continue with empty array
  }

  // Check if sync data is available
  if (!recordingSession.syncOffsets_ms || !recordingSession.syncConfidence) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            Sync Data Not Ready
          </h2>
          <p className="text-yellow-800 dark:text-yellow-200">
            Sync computation has not been completed yet. Please trigger sync
            from the session overview page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sync Review
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review automatic sync results and approve or manually adjust offsets
        </p>
      </div>

      <SyncReviewCockpit
        session={recordingSession}
        assets={assets}
        authToken={session.strapiJwt}
        locale={locale}
      />
    </div>
  );
}
