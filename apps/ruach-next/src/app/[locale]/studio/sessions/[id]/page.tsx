import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSession, getSessionAssets } from '@/lib/studio';
import SessionHeader from '@/components/studio/SessionDetail/SessionHeader';
import AssetStatusCards from '@/components/studio/SessionDetail/AssetStatusCards';
import SessionActions from '@/components/studio/SessionDetail/SessionActions';

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/sessions/${id}`);
  }

  // Fetch session and assets
  let recordingSession;
  let assets: Awaited<ReturnType<typeof getSessionAssets>> = [];

  try {
    recordingSession = await getSession(id, session.strapiJwt);
  } catch (error) {
    console.error('[Session Detail] Failed to fetch session:', error);
    redirect(`/${locale}/studio/sessions?error=fetch_failed`);
  }

  try {
    assets = await getSessionAssets(id, session.strapiJwt);
  } catch (error) {
    console.warn('[Session Detail] Failed to fetch assets (non-fatal):', error);
    // Assets may not exist yet — continue with empty array
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <SessionHeader session={recordingSession} />

      <AssetStatusCards assets={assets} session={recordingSession} />

      <SessionActions
        session={recordingSession}
        locale={locale}
        authToken={session.strapiJwt}
      />
    </div>
  );
}
