import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SessionCreateWizard from '@/components/studio/SessionCreate/SessionCreateWizard';

export const metadata = {
  title: 'New Session - Ruach Studio',
  description: 'Create a new multi-camera recording session',
};

export default async function NewSessionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(
      `/${locale}/login?callbackUrl=/${locale}/studio/sessions/new`
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Multi-Camera Session
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload 3 camera angles and let our AI sync them automatically
          </p>
        </div>

        <SessionCreateWizard authToken={session.strapiJwt} locale={locale} />
      </div>
    </div>
  );
}
