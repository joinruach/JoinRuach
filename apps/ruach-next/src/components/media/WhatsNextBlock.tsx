// src/components/media/WhatsNextBlock.tsx
import LocalizedLink from "@/components/navigation/LocalizedLink";

type RelatedMediaItem = {
  title: string;
  href: string;
  excerpt?: string;
  category?: string;
  thumbnail?: { src: string };
};

type WhatsNextBlockProps = {
  relatedMedia: RelatedMediaItem[];
  currentCategory?: string;
};

export default function WhatsNextBlock({
  relatedMedia,
  currentCategory,
}: WhatsNextBlockProps) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-amber-50 to-white p-8 dark:border-white/10 dark:from-amber-950/20 dark:to-white/5 sm:p-12">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          What's Next?
        </h2>
        <p className="mt-2 text-base text-zinc-700 dark:text-zinc-300">
          Keep pressing in—here are your next steps
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Related Media */}
        {relatedMedia.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
            <div className="mb-4 text-3xl">🎥</div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
              Watch More {currentCategory ? `${currentCategory}` : ""}
            </h3>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Continue the journey with related content
            </p>
            <div className="space-y-2">
              {relatedMedia.slice(0, 2).map((item) => (
                <LocalizedLink key={item.href} href={item.href}>
                  <div className="group rounded-lg border border-zinc-200 p-3 text-sm transition hover:border-amber-400 hover:bg-amber-50 dark:border-white/10 dark:hover:border-amber-600 dark:hover:bg-amber-950/20">
                    <p className="font-medium text-zinc-900 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-400">
                      {item.title}
                    </p>
                  </div>
                </LocalizedLink>
              ))}
            </div>
            <LocalizedLink href="/media">
              <span className="mt-4 inline-block text-sm font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300">
                Browse all media →
              </span>
            </LocalizedLink>
          </div>
        )}

        {/* Start a Course */}
        <LocalizedLink href="/courses">
          <div className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-amber-400 hover:bg-amber-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-amber-600 dark:hover:bg-amber-950/20">
            <div className="mb-4 text-3xl">📚</div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-900 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-400">
              Go Deeper with Courses
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Structured teaching and discipleship to equip you for Kingdom work
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-amber-600 group-hover:text-amber-500 dark:text-amber-400 dark:group-hover:text-amber-300">
              Explore courses →
            </span>
          </div>
        </LocalizedLink>

        {/* Request Prayer */}
        <LocalizedLink href="/prayer">
          <div className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-amber-400 hover:bg-amber-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-amber-600 dark:hover:bg-amber-950/20">
            <div className="mb-4 text-3xl">🙏</div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-900 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-400">
              Need Prayer?
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Share your request and let us stand with you in prayer
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-amber-600 group-hover:text-amber-500 dark:text-amber-400 dark:group-hover:text-amber-300">
              Request prayer →
            </span>
          </div>
        </LocalizedLink>
      </div>

      {/* Partner CTA */}
      <div className="mt-8 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-100 to-white p-6 text-center dark:border-amber-600/30 dark:from-amber-950/30 dark:to-white/5">
        <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-white">
          Blessed by this content?
        </p>
        <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
          Partner with us to make more discipleship, media, and outreach possible.
        </p>
        <LocalizedLink href="/partners">
          <span className="inline-block rounded-full bg-zinc-900 px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-900">
            Become a Partner
          </span>
        </LocalizedLink>
      </div>
    </section>
  );
}
