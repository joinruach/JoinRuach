import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/studio/sessions';
import { getEDL } from '@/lib/studio/edl';
import { EDLEditorPage } from '@/components/studio/EDL/EDLEditorPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'EDL Editor - Ruach Studio',
  description: 'Edit timeline and camera cuts',
};

export default async function SessionEDLPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/sessions/${id}/edl`);
  }

  const recordingSession = await getSession(id, session.strapiJwt);

  // Verify session is ready for EDL editing
  if (recordingSession.status !== 'editing' && recordingSession.status !== 'synced') {
    redirect(`/${locale}/studio/sessions/${id}`);
  }

  // Fetch existing EDL or show generate button
  const edl = await getEDL(id, session.strapiJwt);

  return (
    <EDLEditorPage
      sessionId={id}
      session={recordingSession}
      initialEDL={edl}
      authToken={session.strapiJwt}
      locale={locale}
    />
  );
}
