import { getScriptureWorkBySlug, getScriptureVerses } from '@/lib/strapi';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ChapterPageProps {
  params: Promise<{
    locale: string;
    workSlug: string;
    chapter: string;
  }>;
}

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const { workSlug, chapter } = await params;
  const chapterNum = parseInt(chapter, 10);
  const work = await getScriptureWorkBySlug(workSlug);

  if (!work || isNaN(chapterNum)) {
    return {
      title: 'Chapter Not Found',
    };
  }

  return {
    title: `${work.canonicalName} ${chapter} - YahScriptures`,
    description: `Read ${work.canonicalName} chapter ${chapter} with original Hebrew divine names preserved.`,
  };
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { locale, workSlug, chapter } = await params;
  const chapterNum = parseInt(chapter, 10);

  if (isNaN(chapterNum) || chapterNum < 1) {
    notFound();
  }

  const work = await getScriptureWorkBySlug(workSlug);

  if (!work) {
    notFound();
  }

  if (chapterNum > work.totalChapters) {
    notFound();
  }

  // Fetch verses for this chapter
  const verses = await getScriptureVerses(work.workId, chapterNum);

  if (verses.length === 0) {
    notFound();
  }

  const prevChapter = chapterNum > 1 ? chapterNum - 1 : null;
  const nextChapter = chapterNum < work.totalChapters ? chapterNum + 1 : null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link
            href={`/${locale}/scripture`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Scripture
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link
            href={`/${locale}/scripture/${work.workId}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {work.canonicalName}
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600 dark:text-gray-400">Chapter {chapterNum}</span>
        </nav>

        {/* Chapter Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            {work.canonicalName} {chapterNum}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {verses.length} {verses.length === 1 ? 'verse' : 'verses'}
          </p>
        </div>

        {/* Chapter Navigation (Top) */}
        <ChapterNavigation
          work={work}
          locale={locale}
          currentChapter={chapterNum}
          prevChapter={prevChapter}
          nextChapter={nextChapter}
        />

        {/* Verses */}
        <div className="my-8 space-y-4">
          {verses.map((verse) => (
            <div
              key={verse.documentId}
              className="flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 p-3 rounded transition-colors"
            >
              <span className="text-gray-400 dark:text-gray-500 font-semibold min-w-[2rem] text-right">
                {verse.verse}
              </span>
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                {verse.text}
              </p>
            </div>
          ))}
        </div>

        {/* Chapter Navigation (Bottom) */}
        <ChapterNavigation
          work={work}
          locale={locale}
          currentChapter={chapterNum}
          prevChapter={prevChapter}
          nextChapter={nextChapter}
        />
      </div>
    </div>
  );
}

interface ChapterNavigationProps {
  work: {
    workId: string;
    canonicalName: string;
  };
  locale: string;
  currentChapter: number;
  prevChapter: number | null;
  nextChapter: number | null;
}

function ChapterNavigation({
  work,
  locale,
  currentChapter,
  prevChapter,
  nextChapter,
}: ChapterNavigationProps) {
  return (
    <div className="flex items-center justify-between py-4 border-t border-b border-gray-200 dark:border-gray-700">
      <div>
        {prevChapter && (
          <Link
            href={`/${locale}/scripture/${work.workId}/${prevChapter}`}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>← Chapter {prevChapter}</span>
          </Link>
        )}
      </div>

      <Link
        href={`/${locale}/scripture/${work.workId}`}
        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      >
        {work.canonicalName}
      </Link>

      <div>
        {nextChapter && (
          <Link
            href={`/${locale}/scripture/${work.workId}/${nextChapter}`}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>Chapter {nextChapter} →</span>
          </Link>
        )}
      </div>
    </div>
  );
}
