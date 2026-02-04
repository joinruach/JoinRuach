import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { fetchInboxItems, calculateQueueStats } from '@/lib/studio';
import OperatorInbox from '@/components/studio/OperatorInbox';
import InboxStats from '@/components/studio/InboxStats';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Operator Inbox - Ruach Studio',
  description: 'Manage your studio workflows and prioritize attention items',
};

export default async function StudioInboxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio`);
  }

  // Fetch inbox items from all workflows
  const inboxItems = await fetchInboxItems(session.strapiJwt);
  const stats = calculateQueueStats(inboxItems);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Operator Inbox
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {inboxItems.length > 0
            ? `${stats.urgent > 0 ? `⚠️ ${stats.urgent} urgent items need attention. ` : ''}What needs your attention right now?`
            : 'All clear! No items need attention right now.'}
        </p>
      </div>

      {/* Queue Statistics */}
      <InboxStats stats={stats} />

      {/* Main Inbox */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <OperatorInbox items={inboxItems} locale={locale} />
      </div>
    </div>
  );
}
