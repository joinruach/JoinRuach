import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Awakening Complete | Remnant Guidebook',
  description: 'You have completed Phase 1: Awakening. Proceed to Phase 2: Separation.',
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AwakeningCompletePage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <svg
              className="h-8 w-8 text-amber-700 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
            Awakening Complete
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            You have finished Phase 1 of the formation journey.
          </p>
        </header>

        {/* Summary */}
        <section className="mb-12 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:shadow-none">
          <h2 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-white">
            What You've Accomplished
          </h2>
          <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
            <p>In the Awakening phase, you have:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                Examined the sources of your theology and tested them against Scripture
              </li>
              <li>
                Reset your understanding of authority—placing Scripture above teachers,
                traditions, and experiences
              </li>
              <li>Committed to formation over consumption, depth over speed</li>
            </ul>
            <p className="text-sm italic text-neutral-600 dark:text-neutral-400">
              This is not the end. It is the beginning.
            </p>
          </div>
        </section>

        {/* Next Phase */}
        <section className="mb-12 rounded-2xl border-2 border-amber-200 bg-amber-50 p-8 dark:border-amber-900/30 dark:bg-amber-950/20">
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-white">
            What's Next: Separation
          </h2>
          <p className="mb-6 text-neutral-700 dark:text-neutral-300">
            Phase 2 will guide you through the process of separating from false doctrine,
            toxic systems, and spiritual manipulation. This is where formation becomes
            costly—but necessary.
          </p>
          <div className="rounded-xl border border-amber-300 bg-white/50 p-6 dark:border-amber-800 dark:bg-neutral-900/50">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
              Coming Soon
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              Phase 2: Separation is currently being prepared. You will be notified when it
              becomes available.
            </p>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href={`/${locale}/guidebook/awakening`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Review Awakening
          </Link>

          <Link
            href={`/${locale}/guidebook`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
          >
            Return to Guidebook
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* Footer Note */}
        <footer className="mt-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            "The fear of the Lord is the beginning of wisdom."
            <br />
            <span className="text-xs">— Proverbs 9:10</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
