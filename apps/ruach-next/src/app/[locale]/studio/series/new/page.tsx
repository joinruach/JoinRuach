import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SeriesForm from '@/components/studio/SeriesForm';
import { createSeriesAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewSeriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/series/new`);
  }

  const handleSubmit = async (data: { title: string; slug: string; description?: string }) => {
    'use server';

    const result = await createSeriesAction(data);

    if (!result.success) {
      throw new Error(result.error || 'Failed to create series');
    }

    redirect(`/${locale}/studio/series`);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Series</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create a new series to organize related content
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <SeriesForm
          onSubmit={handleSubmit}
          onCancel={() => redirect(`/${locale}/studio/series`)}
        />
      </div>
    </div>
  );
}
