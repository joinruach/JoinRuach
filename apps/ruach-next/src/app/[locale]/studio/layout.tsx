import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import StudioNav from '@/components/studio/StudioNav';
import { hasStudioAccess } from '@/lib/authorization';
import { fetchInboxItems, calculateQueueStats } from '@/lib/studio';

export const metadata = {
  title: 'Ruach Studio',
  description: 'Content management for Ruach Ministries',
};

export default async function StudioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params
  const { locale } = await params;

  // Dev-only: bypass auth for mock EDL visual testing
  const isMockMode = process.env.NEXT_PUBLIC_DEV_MOCK_EDL === 'true';

  // Check authentication (extra safety, middleware already checks)
  const session = isMockMode ? null : await auth();

  console.log('[Studio Layout] Checking authorization');
  console.log('[Studio Layout] Session exists:', !!session);
  console.log('[Studio Layout] User role:', session?.role);

  if (!session && !isMockMode) {
    console.log('[Studio Layout] No session, redirecting to login');
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio`);
  }

  // Check studio access - only 'studio' and 'admin' roles allowed
  const hasAccess = isMockMode || hasStudioAccess(session?.role);
  console.log('[Studio Layout] Has studio access:', hasAccess);

  if (!hasAccess) {
    console.log('[Studio Layout] Access denied, redirecting to unauthorized');
    redirect(`/${locale}/unauthorized?reason=studio_access`);
  }

  console.log('[Studio Layout] Access granted, rendering studio');

  // Fetch inbox items to get badge counts for navigation
  let urgentCount = 0;
  let failedCount = 0;

  try {
    if (session?.strapiJwt) {
      const inboxItems = await fetchInboxItems(session.strapiJwt);
      const stats = calculateQueueStats(inboxItems);
      urgentCount = stats.urgent;
      failedCount = stats.failed;
    }
  } catch (error) {
    console.error('[Studio Layout] Failed to fetch inbox stats:', error);
    // Continue rendering without counts
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Sidebar */}
      <StudioNav
        userRole={session?.role ?? 'studio'}
        urgentCount={urgentCount}
        failedCount={failedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
