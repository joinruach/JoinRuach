import LocalizedLink from "@/components/navigation/LocalizedLink";
import type { LandingConfig } from "@/lib/types/strapi-types";
import type { ReactNode } from "react";

type MiniCourseLandingProps = {
  slug: string;
  landingConfig: LandingConfig;
  firstLessonSlug?: string;
  detoxSlug?: string;
};

const SectionHeading = ({ children }: { children: ReactNode }) => (
  <h2 className="text-2xl font-semibold text-neutral-900">{children}</h2>
);

export default function MiniCourseLanding({
  slug,
  landingConfig,
  firstLessonSlug,
  detoxSlug,
}: MiniCourseLandingProps) {
  const hero = landingConfig.hero;
  const startLessonUrl = hero?.primaryCtaUrl
    ? hero.primaryCtaUrl
    : firstLessonSlug
      ? `/courses/${slug}/${firstLessonSlug}`
      : `/courses/${slug}`;
  const detoxUrl = detoxSlug ? `/courses/${detoxSlug}` : landingConfig.detoxBridge?.buttonUrl;
  const startLabel = hero?.primaryCtaLabel ?? "Start Free Course";
  const detoxLabel = hero?.secondaryCtaLabel ?? landingConfig.detoxBridge?.buttonLabel ?? "Start Detox 101";
  const outcomes = landingConfig.outcomes ?? [];
  const segments = landingConfig.segments ?? [];
  const scriptures = landingConfig.scripturePassages ?? [];
  const delimiter = landingConfig.scriptureHelperLine ?? "Read slowly. Let Scripture set the frame.";

  return (
    <div className="space-y-10 pb-32">
      <section className="space-y-6 rounded-3xl border border-zinc-200 bg-white/90 p-6 text-neutral-900 shadow-sm">
        {hero?.optionalBadge ? (
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-500">
            {hero.optionalBadge}
          </span>
        ) : null}
        <div className="space-y-3">
          {hero?.title ? (
            <h1 className="text-3xl font-semibold leading-tight text-neutral-900">{hero.title}</h1>
          ) : null}
          {hero?.promiseLine ? (
            <p className="text-lg text-neutral-700">{hero.promiseLine}</p>
          ) : null}
          {hero?.microTrustLine ? (
            <p className="text-sm uppercase tracking-wider text-neutral-500">{hero.microTrustLine}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <LocalizedLink href={startLessonUrl}>
            <span className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700">
              {startLabel}
            </span>
          </LocalizedLink>
          {detoxUrl ? (
            <LocalizedLink href={detoxUrl}>
              <span className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-900 transition hover:border-neutral-500">
                {detoxLabel}
              </span>
            </LocalizedLink>
          ) : null}
        </div>
      </section>

      {outcomes.length ? (
        <section className="space-y-3 rounded-3xl border border-zinc-200 bg-white/90 p-6 text-neutral-900">
          <SectionHeading>What you’ll get</SectionHeading>
          <div className="space-y-2 text-base text-neutral-600">
            {outcomes.map((outcome, index) => (
              <p key={index} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-900" />
                <span>{outcome.label ?? outcome.text}</span>
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {segments.length ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeading>Course Structure</SectionHeading>
            <p className="text-sm uppercase tracking-wide text-neutral-500">Swipe →</p>
          </div>
          <div className="flex snap-mandatory gap-4 overflow-x-auto pb-2">
            {segments.map((segment, index) => (
              <div
                key={index}
                className="snap-start min-w-[200px] rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-neutral-700 shadow-sm"
              >
                <div className="text-xs uppercase tracking-wide text-amber-500">
                  {segment.durationMinutes ? `${segment.durationMinutes} min` : "Segment"}
                </div>
                <p className="mt-1 text-base font-semibold text-neutral-900">{segment.name}</p>
                {segment.outcome ? <p className="mt-2 text-sm text-neutral-500">{segment.outcome}</p> : null}
                {segment.previewLabel || segment.previewUrl ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {segment.previewLabel ?? "Tap to preview"}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {scriptures.length ? (
        <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white/90 p-6 text-neutral-900">
          <div className="space-y-1">
            <SectionHeading>Core Scriptural Foundation</SectionHeading>
            <p className="text-sm text-neutral-500">{delimiter}</p>
          </div>
          <div className="space-y-2">
            {scriptures.map((passage, index) => (
              <details
                key={index}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 group"
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-neutral-900">
                  <span>{passage.reference}</span>
                  <span className="text-neutral-500 group-open:text-amber-400">▼</span>
                </summary>
                {passage.text ? (
                  <p className="mt-3 text-sm leading-relaxed text-neutral-800">{passage.text}</p>
                ) : null}
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {landingConfig.deliverable ? (
        <section className="rounded-3xl border border-zinc-200 bg-white/90 p-6 text-neutral-900 shadow-sm">
          <div className="space-y-2">
            <SectionHeading>{landingConfig.deliverable.title}</SectionHeading>
            {landingConfig.deliverable.description ? (
              <p className="text-base text-neutral-600">{landingConfig.deliverable.description}</p>
            ) : null}
            {landingConfig.deliverable.tagline ? (
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                {landingConfig.deliverable.tagline}
              </p>
            ) : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {landingConfig.deliverable.auditWizardUrl ? (
              <LocalizedLink href={landingConfig.deliverable.auditWizardUrl}>
                <span className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700">
                  Start the Audit Wizard
                </span>
              </LocalizedLink>
            ) : null}
            {landingConfig.deliverable.pdfUrl ? (
              <a
                href={landingConfig.deliverable.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-900 transition hover:border-neutral-500"
              >
                Download PDF
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {(landingConfig.whoItsFor?.length || landingConfig.whoItsNotFor?.length) ? (
        <section className="rounded-3xl border border-zinc-200 bg-white/90 p-6 text-neutral-900">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-amber-500">For</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                {(landingConfig.whoItsFor ?? []).map((item, idx) => (
                  <li key={`for-${idx}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-900" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">Not for</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                {(landingConfig.whoItsNotFor ?? []).map((item, idx) => (
                  <li key={`not-${idx}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-900" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {landingConfig.processSteps?.length ? (
        <section className="rounded-3xl border border-zinc-200 bg-white/90 p-6 text-neutral-900">
          <SectionHeading>How this works</SectionHeading>
          <div className="mt-4 space-y-3 text-sm text-neutral-600">
            {landingConfig.processSteps.map((step, index) => (
              <div key={index} className="flex gap-3">
                <span className="font-semibold text-neutral-900">{index + 1}.</span>
                <div>
                  <p className="font-semibold text-neutral-900">{step.title}</p>
                  {step.body ? <p>{step.body}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {landingConfig.detoxBridge ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-neutral-900">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-600">Detox 101</p>
            <SectionHeading>{landingConfig.detoxBridge.title}</SectionHeading>
            {landingConfig.detoxBridge.body ? (
              <p className="text-sm text-neutral-800">{landingConfig.detoxBridge.body}</p>
            ) : null}
          </div>
          {detoxUrl ? (
            <LocalizedLink href={detoxUrl}>
              <span className="mt-5 inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700">
                {landingConfig.detoxBridge.buttonLabel ?? "Start Detox 101"}
              </span>
            </LocalizedLink>
          ) : null}
        </section>
      ) : null}

      {landingConfig.faqItems?.length ? (
        <section className="space-y-2 rounded-3xl border border-zinc-200 bg-white/90 p-6 text-neutral-900">
          <SectionHeading>FAQs</SectionHeading>
          <div className="space-y-2">
            {landingConfig.faqItems.map((faq, index) => (
              <details key={index} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-neutral-900 hover:text-amber-500">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm text-neutral-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <div className="h-24" />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/90 px-6 py-3 backdrop-blur md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LocalizedLink href={startLessonUrl}>
            <span className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700">
              {startLabel}
            </span>
          </LocalizedLink>
          {detoxUrl ? (
            <LocalizedLink href={detoxUrl}>
              <span className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-900">
                {detoxLabel}
              </span>
            </LocalizedLink>
          ) : null}
        </div>
      </div>
    </div>
  );
}
