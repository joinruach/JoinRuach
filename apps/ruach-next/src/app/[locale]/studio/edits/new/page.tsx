import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Create EDL - Ruach Studio',
  description: 'Create a new edit decision list',
};

export default async function NewEDLPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/edits/new`);
  }

  return (
    <div className="space-y-8">
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
          href={`/${locale}/studio/edits`}
          className="hover:text-ruachGold transition-colors"
        >
          Edit Decisions
        </Link>
        <span>›</span>
        <span className="text-gray-900 dark:text-white">Create EDL</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create Edit Decision List
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Generate AI-powered edit decisions from recording sessions
        </p>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-6xl mb-6">🚧</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            EDL Creation Coming Soon
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The EDL creation workflow is currently under development. This feature will allow you to:
          </p>

          <div className="text-left space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📹</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Select Recording Sessions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose from multi-camera recording sessions to generate EDLs
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  AI-Powered Edit Generation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically generate camera switches, chapters, and timing based on transcript analysis
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">✏️</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Review & Refine
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review AI suggestions, make manual adjustments, and approve final edits
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">📤</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Export to Editors
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate EDL files for Final Cut Pro, Premiere, DaVinci Resolve, and more
                </p>
              </div>
            </div>
          </div>

          <Link
            href={`/${locale}/studio/edits`}
            className="inline-block px-6 py-3 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            ← Back to Edit Decisions
          </Link>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Implementation Status
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-200">
              The backend EDL schema and recording session infrastructure are ready.
              The frontend creation workflow is scheduled for Phase 5 of the studio development roadmap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
