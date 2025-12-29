import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getRecentMediaItems } from '@/lib/strapi-admin';
import ContentTable from '@/components/studio/ContentTable';
import Link from 'next/link';
import { deleteMediaItemAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function ContentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.strapiJwt) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/studio/content`);
  }

  // Fetch all media items (using recent for now, would paginate in production)
  const items = await getRecentMediaItems(session.strapiJwt, 100);

  const handleDelete = async (id: number) => {
    'use server';
    await deleteMediaItemAction(id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Library</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage all your media items
          </p>
        </div>
        <Link
          href={`/${locale}/studio/upload`}
          className="px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 font-medium"
        >
          + Upload New
        </Link>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <ContentTable items={items} locale={locale} onDelete={handleDelete} />
      </div>
    </div>
  );
}
