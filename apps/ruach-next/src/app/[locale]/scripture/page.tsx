import { getScriptureWorks } from '@/lib/strapi';
import { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'YahScriptures - Sacred Texts',
  description: 'Explore the complete biblical canon with original Hebrew divine names preserved.',
};

interface ScripturePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ScripturePage({ params }: ScripturePageProps) {
  const { locale } = await params;
  const works = await getScriptureWorks();

  // Group works by testament
  const oldTestament = works.filter((work) => work.testament === 'tanakh');
  const newTestament = works.filter((work) => work.testament === 'renewed_covenant');

  // Debug logging (will show in server logs during development)
  if (works.length === 0) {
    console.warn('[Scripture Page] No scripture works found. Check if data exists in Strapi.');
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            YahScriptures
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore the complete biblical canon with original Hebrew divine names preserved.
          </p>
        </div>

        {works.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold mb-2">No Scripture Books Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Scripture content is not yet available. Please check back later.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              If you're an administrator, ensure scripture data has been imported into Strapi.
            </p>
          </div>
        ) : (
          <>
            {/* Old Testament */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 dark:border-gray-700 pb-2">
                Old Testament
              </h2>
              {oldTestament.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 italic">No Old Testament books found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {oldTestament.map((work) => (
                    <BookCard key={work.documentId} locale={locale} work={work} />
                  ))}
                </div>
              )}
            </section>

            {/* New Testament */}
            <section>
              <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 dark:border-gray-700 pb-2">
                New Testament
              </h2>
              {newTestament.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 italic">No New Testament books found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {newTestament.map((work) => (
                    <BookCard key={work.documentId} locale={locale} work={work} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function BookCard({
  locale,
  work,
}: {
  locale: string;
  work: Awaited<ReturnType<typeof getScriptureWorks>>[number];
}) {
  return (
    <Link
      href={`/${locale}/scripture/${work.workId}`}
      className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex flex-col h-full">
        <h3 className="font-bold text-lg mb-1">{work.canonicalName}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {work.translatedTitle}
        </p>
        <div className="mt-auto text-xs text-gray-500 dark:text-gray-500">
          <div>{work.totalChapters} chapters</div>
          <div>{work.totalVerses} verses</div>
        </div>
      </div>
    </Link>
  );
}
