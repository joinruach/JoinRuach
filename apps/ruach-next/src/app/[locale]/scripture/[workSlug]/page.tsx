import { getScriptureWorkBySlug } from '@/lib/strapi';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface BookPageProps {
  params: Promise<{
    locale: string;
    workSlug: string;
  }>;
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { workSlug } = await params;
  const work = await getScriptureWorkBySlug(workSlug);

  if (!work) {
    return {
      title: 'Book Not Found',
    };
  }

  return {
    title: `${work.canonicalName} - YahScriptures`,
    description: `Read ${work.canonicalName} (${work.translatedTitle}) with original Hebrew divine names preserved. ${work.totalChapters} chapters, ${work.totalVerses} verses.`,
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { workSlug } = await params;
  const work = await getScriptureWorkBySlug(workSlug);

  if (!work) {
    notFound();
  }

  // Generate array of chapter numbers
  const chapters = Array.from({ length: work.totalChapters }, (_, i) => i + 1);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link
            href="/scripture"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Scripture
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600 dark:text-gray-400">{work.canonicalName}</span>
        </nav>

        {/* Book Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            {work.canonicalName}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            {work.translatedTitle}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
              {work.testament === 'tanakh' ? 'Tanakh (Old Testament)' :
               work.testament === 'renewed_covenant' ? 'Renewed Covenant (New Testament)' :
               'Apocrypha'}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
              {work.genre}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
              {work.totalChapters} chapters
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
              {work.totalVerses} verses
            </span>
          </div>
        </div>

        {/* Chapters Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Chapters</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {chapters.map((chapter) => (
              <Link
                key={chapter}
                href={`/scripture/${work.workId}/${chapter}`}
                className="flex items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 font-semibold"
              >
                {chapter}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
