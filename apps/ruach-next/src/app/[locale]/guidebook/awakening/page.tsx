import { Metadata } from 'next';
import Link from 'next/link';
import { AwakeningPhase } from '@ruach/formation';

export const metadata: Metadata = {
  title: 'Awakening | Remnant Guidebook',
  description: 'Phase 1: Reorient your beliefs around Scripture as the ultimate authority.',
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AwakeningPage({ params }: PageProps) {
  const { locale } = await params;
  const { metadata, sections } = AwakeningPhase;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Phase Header */}
        <header className="mb-12">
          <div className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Phase 1 of 5
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
            {metadata.title}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            {metadata.description}
          </p>
        </header>

        {/* Phase Overview */}
        <section className="mb-12 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:shadow-none">
          <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">
            What to Expect
          </h2>
          <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
            <p>
              Awakening is about testing your foundations. You will be invited to examine
              where your beliefs came from, whether they align with Scripture, and if you
              are willing to rebuild on firmer ground.
            </p>
            <p>This phase includes:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>{sections.length} sections</strong> of thoughtful teaching
              </li>
              <li>
                <strong>{metadata.requiredCheckpoints} reflection checkpoints</strong> that
                require honest engagement
              </li>
              <li>
                <strong>Minimum {metadata.expectedDurationDays} days</strong> recommended
                for healthy pacing
              </li>
            </ul>
            <p className="text-sm italic text-neutral-600 dark:text-neutral-400">
              You cannot rush formation. The system will slow you down if needed.
            </p>
          </div>
        </section>

        {/* Sections List */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            Sections
          </h2>

          {sections.map((section, index) => (
            <Link
              key={section.id}
              href={`/${locale}/guidebook/awakening/${section.slug}`}
              className="block rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-white/10 dark:bg-neutral-900 dark:shadow-none dark:hover:border-amber-700"
            >
              <div className="flex items-start gap-6">
                {/* Section Number */}
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg font-bold text-amber-900 dark:bg-amber-900/20 dark:text-amber-300">
                  {section.order}
                </div>

                {/* Section Info */}
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-white">
                    {section.title}
                  </h3>
                  <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {section.estimatedReadingMinutes} min read •{' '}
                    {section.checkpointIds.length}{' '}
                    {section.checkpointIds.length === 1 ? 'checkpoint' : 'checkpoints'}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                    Begin Section
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* Footer Note */}
        <footer className="mt-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
          <p>
            Formation is not a race.
            <br />
            Proceed at the pace required for truth to take root.
          </p>
        </footer>
      </div>
    </div>
  );
}
