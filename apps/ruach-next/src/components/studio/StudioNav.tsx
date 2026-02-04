'use client';

/**
 * Studio Navigation - Workflow-Based Structure
 *
 * Updated navigation reflecting the new workflow-based mental model:
 * - Inbox (prioritized attention items)
 * - Sessions (multi-cam + uploads)
 * - Edit Decisions (EDL management)
 * - Renders (encoding jobs)
 * - Publishing (platform distribution)
 * - Library (content catalog)
 * - Settings (admin only)
 *
 * Features:
 * - Role-based filtering (hides admin-only items from studio users)
 * - Badge counts for urgent/failed items
 * - Collapsible sections
 * - Active state highlighting
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { hasAdminAccess } from '@/lib/authorization';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
  requiredRole?: 'admin';
  children?: NavChild[];
}

interface NavChild {
  name: string;
  href: string;
}

interface StudioNavProps {
  userRole?: string;
  urgentCount?: number;
  failedCount?: number;
}

export default function StudioNav({ userRole, urgentCount = 0, failedCount = 0 }: StudioNavProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(['Sessions', 'Library']);

  if (!pathname) {
    return null;
  }

  const isAdmin = hasAdminAccess(userRole);

  // Workflow-based navigation structure
  const navItems: NavItem[] = [
    {
      name: 'Inbox',
      href: '/studio',
      icon: '📥',
      badge: urgentCount > 0 ? urgentCount : undefined,
    },
    {
      name: 'Sessions',
      href: '/studio/sessions',
      icon: '🎬',
      children: [
        { name: 'All Sessions', href: '/studio/sessions' },
        { name: 'Ingest Queue', href: '/studio/sessions/ingest' },
        { name: 'Upload', href: '/studio/ingestion/upload' },
      ],
    },
    {
      name: 'Edit Decisions',
      href: '/studio/edits',
      icon: '✂️',
    },
    {
      name: 'Renders',
      href: '/studio/renders',
      icon: '🎞️',
      badge: failedCount > 0 ? failedCount : undefined,
    },
    {
      name: 'Publishing',
      href: '/studio/publish/jobs',
      icon: '🚀',
    },
    {
      name: 'Library',
      href: '/studio/library',
      icon: '📚',
      children: [
        { name: 'Overview', href: '/studio/library' },
        { name: 'Content', href: '/studio/library/content' },
        { name: 'Series', href: '/studio/library/series' },
      ],
    },
    {
      name: 'Settings',
      href: '/studio/settings',
      icon: '⚙️',
      requiredRole: 'admin',
    },
  ];

  // Filter navigation based on user role
  const visibleItems = navItems.filter((item) => {
    if (item.requiredRole === 'admin' && !isAdmin) return false;
    return true;
  });

  // Extract locale from pathname (e.g., /en/studio -> en)
  const locale = pathname.split('/')[1] || 'en';
  const currentPath = pathname.replace(`/${locale}`, '') || '/';

  const toggleSection = (name: string) => {
    setExpandedSections((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === '/studio') {
      return currentPath === '/studio';
    }
    return currentPath.startsWith(href);
  };

  const isChildActive = (childHref: string) => {
    return currentPath === childHref || currentPath.startsWith(`${childHref}/`);
  };

  return (
    <nav className="bg-ruachDark text-white h-screen w-64 flex flex-col overflow-y-auto">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-gray-700 sticky top-0 bg-ruachDark z-10">
        <Link href={`/${locale}/`} className="text-2xl font-bold text-ruachGold">
          Ruach Studio
        </Link>
        <p className="text-sm text-gray-400 mt-1">Content Operations</p>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1">
        {visibleItems.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const active = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedSections.includes(item.name);

          return (
            <div key={item.href}>
              {/* Parent Item */}
              <div className="relative">
                <Link
                  href={fullHref}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      active
                        ? 'bg-ruachGold text-ruachDark font-medium'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="flex-1">{item.name}</span>

                  {/* Badge for urgent/failed counts */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white min-w-[20px]">
                      {item.badge}
                    </span>
                  )}

                  {/* Expand/collapse indicator */}
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSection(item.name);
                      }}
                      className="p-1 hover:bg-gray-700 rounded"
                    >
                      <span className="text-sm">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </button>
                  )}
                </Link>
              </div>

              {/* Child Items */}
              {hasChildren && isExpanded && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children?.map((child) => {
                    const childFullHref = `/${locale}${child.href}`;
                    const childActive = isChildActive(child.href);

                    return (
                      <Link
                        key={child.href}
                        href={childFullHref}
                        className={`
                          block px-4 py-2 rounded-lg text-sm transition-colors
                          ${
                            childActive
                              ? 'bg-gray-700 text-ruachGold font-medium'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }
                        `}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Menu / Logout */}
      <div className="p-4 border-t border-gray-700 sticky bottom-0 bg-ruachDark">
        {/* Role Badge */}
        {userRole && (
          <div className="mb-3 px-4 py-2 rounded-lg bg-gray-800 text-center">
            <span className="text-xs text-gray-400">Signed in as</span>
            <p className="text-sm font-medium text-white capitalize">{userRole}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
