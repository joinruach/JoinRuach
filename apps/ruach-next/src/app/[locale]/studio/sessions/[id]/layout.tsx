import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SessionSidebar from '@/components/studio/SessionSidebar';
import { getSession } from '@/lib/studio';

export default async function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/sessions/${id}`);
  }

  // Fetch the recording session
  let recordingSession;
  try {
    recordingSession = await getSession(id, session.strapiJwt);
  } catch (error) {
    console.error('[Session Layout] Failed to fetch session:', error);
    redirect(`/${locale}/studio/sessions?error=session_not_found`);
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <SessionSidebar session={recordingSession} locale={locale} />
      <main className="flex-1 overflow-auto bg-white dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}
