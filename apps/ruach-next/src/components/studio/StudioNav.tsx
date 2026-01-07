'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function StudioNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/studio', icon: '📊' },
    { name: 'Upload', href: '/studio/upload', icon: '📤' },
    { name: 'Content', href: '/studio/content', icon: '📚' },
    { name: 'Publishing', href: '/studio/publishing', icon: '🚀' },
    { name: 'Series', href: '/studio/series', icon: '📖' },
    { name: 'Ingestion', href: '/studio/ingestion', icon: '📥' },
  ];

  // Extract locale from pathname (e.g., /en/studio -> en)
  const locale = pathname.split('/')[1];
  const currentPath = pathname.replace(`/${locale}`, '');

  return (
    <nav className="bg-ruachDark text-white h-screen w-64 flex flex-col">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-gray-700">
        <Link href={`/${locale}/`} className="text-2xl font-bold text-ruachGold">
          Ruach Studio
        </Link>
        <p className="text-sm text-gray-400 mt-1">Content Management</p>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={fullHref}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isActive
                    ? 'bg-ruachGold text-ruachDark font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User Menu / Logout */}
      <div className="p-4 border-t border-gray-700">
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
