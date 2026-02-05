'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session, SessionStatus } from '@/lib/studio';

interface NavLinkProps {
  href: string;
  active: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

function NavLink({ href, active, disabled, children }: NavLinkProps) {
  const baseClasses =
    'block px-4 py-2 rounded-lg text-sm font-medium transition-colors';
  const activeClasses = active
    ? 'bg-ruachGold text-ruachDark'
    : 'text-gray-300 hover:bg-gray-800 hover:text-white';
  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  if (disabled) {
    return (
      <div className={`${baseClasses} ${activeClasses} ${disabledClasses}`}>
        {children}
      </div>
    );
  }

  return (
    <Link href={href} className={`${baseClasses} ${activeClasses}`}>
      {children}
    </Link>
  );
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const statusConfig: Record<
    SessionStatus,
    { label: string; color: string }
  > = {
    draft: { label: 'Draft', color: 'bg-gray-500' },
    ingesting: { label: 'Ingesting', color: 'bg-blue-500' },
    'needs-review': { label: 'Needs Review', color: 'bg-yellow-500' },
    syncing: { label: 'Syncing', color: 'bg-blue-500' },
    synced: { label: 'Synced', color: 'bg-green-500' },
    editing: { label: 'Editing', color: 'bg-purple-500' },
    rendering: { label: 'Rendering', color: 'bg-orange-500' },
    published: { label: 'Published', color: 'bg-green-600' },
    archived: { label: 'Archived', color: 'bg-gray-600' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium text-white rounded ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function getPrimaryAction(status: SessionStatus): {
  label: string;
  href: string;
} | null {
  switch (status) {
    case 'needs-review':
      return { label: 'Review Sync', href: './sync-review' };
    case 'synced':
      return { label: 'Generate Transcript', href: './transcript' };
    case 'editing':
      return { label: 'Edit Timeline', href: './edl' };
    case 'rendering':
      return { label: 'View Render', href: './render' };
    default:
      return null;
  }
}

// Determine if a page should be enabled based on session status
function isPageEnabled(page: string, status: SessionStatus): boolean {
  const statusOrder: SessionStatus[] = [
    'draft',
    'ingesting',
    'needs-review',
    'syncing',
    'synced',
    'editing',
    'rendering',
    'published',
    'archived',
  ];

  const currentIndex = statusOrder.indexOf(status);

  // Overview always enabled
  if (page === 'overview') return true;

  // Sync review enabled once ingesting complete
  if (page === 'sync-review')
    return currentIndex >= statusOrder.indexOf('needs-review');

  // Transcript enabled once synced
  if (page === 'transcript')
    return currentIndex >= statusOrder.indexOf('synced');

  // EDL enabled once editing
  if (page === 'edl') return currentIndex >= statusOrder.indexOf('editing');

  return false;
}

export default function SessionSidebar({
  session,
  locale,
}: {
  session: Session;
  locale: string;
}) {
  const pathname = usePathname();

  const primaryAction = getPrimaryAction(session.status);

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Session header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-medium text-white truncate" title={session.title}>
          {session.title}
        </h2>
        <div className="mt-2">
          <StatusBadge status={session.status} />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Session ID: {session.sessionId}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <NavLink
          href={`/${locale}/studio/sessions/${session.id}`}
          active={
            pathname === `/${locale}/studio/sessions/${session.id}` ||
            (pathname?.endsWith(`/sessions/${session.id}`) ?? false)
          }
        >
          Overview
        </NavLink>

        <NavLink
          href={`/${locale}/studio/sessions/${session.id}/sync-review`}
          active={pathname?.includes('sync-review') ?? false}
          disabled={!isPageEnabled('sync-review', session.status)}
        >
          Sync Review
        </NavLink>

        <NavLink
          href={`/${locale}/studio/sessions/${session.id}/transcript`}
          active={pathname?.includes('transcript') ?? false}
          disabled={!isPageEnabled('transcript', session.status)}
        >
          Transcript
        </NavLink>

        <NavLink
          href={`/${locale}/studio/sessions/${session.id}/edl`}
          active={pathname?.includes('edl') ?? false}
          disabled={!isPageEnabled('edl', session.status)}
        >
          Timeline
        </NavLink>
      </nav>

      {/* Primary CTA */}
      {primaryAction && (
        <div className="p-4 border-t border-gray-800">
          <Link
            href={`/${locale}/studio/sessions/${session.id}${primaryAction.href}`}
            className="block w-full px-4 py-2 bg-ruachGold text-ruachDark text-center rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            {primaryAction.label}
          </Link>
        </div>
      )}

      {/* Back to sessions */}
      <div className="p-4 border-t border-gray-800">
        <Link
          href={`/${locale}/studio/sessions`}
          className="block w-full px-4 py-2 text-center text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Sessions
        </Link>
      </div>
    </aside>
  );
}
