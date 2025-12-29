import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllSpeakers, getAllCategories, getAllSeriesForAdmin } from '@/lib/strapi-admin';
import UploadForm from '@/components/studio/UploadForm';
import { createMediaItemAction } from './actions';
import type { MediaUploadFormData } from '@/lib/upload-schema';

export const dynamic = 'force-dynamic';

export default async function UploadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/upload`);
  }

  // Fetch metadata options
  const [speakers, categories, series] = await Promise.all([
    getAllSpeakers(session.strapiJwt),
    getAllCategories(session.strapiJwt),
    getAllSeriesForAdmin(session.strapiJwt),
  ]);

  const handleSubmit = async (data: MediaUploadFormData) => {
    'use server';

    const result = await createMediaItemAction(data);

    if (!result.success) {
      throw new Error(result.error || 'Failed to create media item');
    }

    // Redirect to content list or edit page
    redirect(`/${locale}/studio/content`);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Media</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Upload and publish new content to your media library
        </p>
      </div>

      <UploadForm
        speakers={speakers}
        categories={categories}
        series={series}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
