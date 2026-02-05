import { auth } from '@/lib/auth';
import { getTranscript, startTranscription } from '@/lib/studio';
import { redirect } from 'next/navigation';
import TranscriptViewerPage from '@/components/studio/Transcript/TranscriptViewerPage';

// Disable caching for live transcript status updates
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function SessionTranscriptPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login`);
  }

  // Fetch transcript (may be null if not yet generated)
  const transcript = await getTranscript(id, session.strapiJwt);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <TranscriptViewerPage
          sessionId={id}
          transcript={transcript}
          authToken={session.strapiJwt}
          locale={locale}
        />
      </div>
    </div>
  );
}
