import { Metadata } from 'next';
import { CovenantEntrance } from './CovenantEntrance';

export const metadata: Metadata = {
  title: 'Enter the Remnant Guidebook | Ruach Ministries',
  description: 'Choose your path: formation or exploration. Not all who enter are ready to be formed.',
  robots: {
    index: false, // Don't index this page (it's a threshold)
  },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function GuidebookEnterPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <CovenantEntrance locale={locale} />
    </div>
  );
}
