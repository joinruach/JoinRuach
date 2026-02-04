import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getRoleName } from '@/lib/authorization';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reason?: string }>;
}

export const metadata = {
  title: 'Unauthorized Access | Ruach',
  description: 'You do not have permission to access this resource',
};

export default async function UnauthorizedPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { reason } = await searchParams;
  const session = await auth();

  // Determine message based on reason
  let title = 'Unauthorized Access';
  let message = 'You do not have permission to access this resource.';

  if (reason === 'studio_access') {
    title = 'Studio Access Required';
    message =
      'Access to Ruach Studio is restricted to authorized staff members only. If you believe you should have access, please contact your administrator.';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900 p-6">
            <svg
              className="w-16 h-16 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400">{message}</p>

        {/* User Info (if logged in) */}
        {session && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Current user:</span> {session.user?.email}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Access level:</span>{' '}
              {getRoleName(session.role)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href={`/${locale}/`}
            className="block w-full bg-ruachGold text-ruachDark font-medium py-3 px-6 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Return to Home
          </Link>

          {session && (
            <Link
              href={`/${locale}/contact`}
              className="block w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Contact Support
            </Link>
          )}
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Need help? Email us at{' '}
          <a
            href="mailto:support@joinruach.org"
            className="text-ruachGold hover:underline"
          >
            support@joinruach.org
          </a>
        </p>
      </div>
    </div>
  );
}
