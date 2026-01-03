import LocalizedLink from "@/components/navigation/LocalizedLink";
import SEOHead from "@/components/ruach/SEOHead";

export default function ThankYouPage() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://joinruach.org";

  const thankYouSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Thank you",
    url: `${site}/thank-you`,
    description: "Thank you for supporting Ruach Ministries.",
  };

  return (
    <div className="space-y-10">
      <SEOHead jsonLd={thankYouSchema} />

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-10 text-zinc-900 dark:text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">
          Thank you
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">
          Thank you for standing with us.
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-600 dark:text-white/70">
          Your gift helps fuel testimonies, formation, and outreach that cannot be centralized
          or controlled. We’re honored to steward what you’ve entrusted.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <LocalizedLink href="/start">
            <span className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-300">
              Start here
            </span>
          </LocalizedLink>
          <LocalizedLink href="/join">
            <span className="rounded-full border border-zinc-300 dark:border-white/20 px-5 py-2 text-sm font-semibold text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
              Learn about partnership
            </span>
          </LocalizedLink>
        </div>
      </section>
    </div>
  );
}

