import { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RuachAssistantFullPage from '@/components/ai/RuachAssistantFullPage';

export const metadata = {
  title: 'AI Assistant',
  description: 'Ruach AI Assistant - Get answers to your questions about Scripture, theology, and spiritual topics.',
};

export default async function AssistantPage({ params: { locale } }: { params: { locale: string } }) {
  const session = await auth();

  // Optionally require authentication - comment out if you want public access
  // if (!session?.user) {
  //   redirect(`/${locale}/login`);
  // }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-white dark:bg-zinc-950">
      <RuachAssistantFullPage />
    </main>
  );
}
