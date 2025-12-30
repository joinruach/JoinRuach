import LocalizedLink from "@/components/navigation/LocalizedLink";
import { Suspense } from "react";
import NewsletterSignup from "@/components/ruach/NewsletterSignup";
import SEOHead from "@/components/ruach/SEOHead";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import CourseGrid from "@ruach/components/components/ruach/CourseGrid";
import type { Course } from "@ruach/components/components/ruach/CourseCard";
import { getCourses, getMediaByCategory, getFeaturedTestimony, imgUrl, getEvents } from "@/lib/strapi";
import RecommendedForYou from "@/components/recommendations/RecommendedForYou";
import {
  extractAttributes,
  extractManyRelation,
  extractSingleRelation,
} from "@/lib/strapi-normalize";
import type { CourseEntity, EventEntity, MediaItemEntity } from "@/lib/types/strapi-types";

type MediaAttributes = MediaItemEntity["attributes"];
type CourseAttributes = CourseEntity["attributes"];
type EventAttributes = EventEntity["attributes"];

async function safeFetch<T>(label: string, fetcher: () => Promise<T>): Promise<T | null> {
  try {
    return await fetcher();
  } catch (error) {
    console.error(`[Fetch failed] ${label}`, error);
    return null;
  }
}

// Ensure fresh data from Strapi on every request without breaking route generation
export const revalidate = 0;

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [courses, testimonies, featured, events] = await Promise.all([
    safeFetch('courses', () => getCourses()),
    safeFetch('testimonies', () => getMediaByCategory("testimony", 6)),
    safeFetch('featuredTestimony', () => getFeaturedTestimony()),
    safeFetch('events', () => getEvents(3))
  ]);

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://joinruach.org";
  const socials = [
    process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
    process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE,
    process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
    process.env.NEXT_PUBLIC_SOCIAL_SPOTIFY
  ].filter(Boolean);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ruach Ministries",
    url: site,
    logo: `${site}/icon.svg`,
    sameAs: socials,
    description: "Ruach Ministries tells testimonies, disciples believers, and mobilizes outreach teams to release the breath of God."
  };

  const testimonyList = (testimonies || [])
    .slice(0, 4)
    .map((entity) => {
      const attributes = extractAttributes<MediaAttributes>(entity);
      if (!attributes?.slug) return null;

      const thumbnailMedia = extractSingleRelation<{ url?: string; alternativeText?: string }>(attributes.thumbnail);
      const speakers = extractManyRelation<{ name?: string; displayName?: string }>(attributes.speakers)
        .map((speaker) => speaker.displayName?.trim() || speaker.name)
        .filter((name): name is string => Boolean(name && name.trim()));
      const categorySource =
        extractSingleRelation<{ name?: string }>(attributes.category)?.name ?? attributes.legacyCategory ?? undefined;
      const category =
        typeof categorySource === "string" && categorySource.trim().length ? categorySource : undefined;

      return {
        title: attributes.title ?? "Untitled Media",
        href: `/media/${attributes.slug}`,
        excerpt: attributes.description ?? attributes.excerpt,
        category,
        thumbnail: thumbnailMedia?.url
          ? { src: thumbnailMedia.url, alt: thumbnailMedia.alternativeText ?? attributes.title }
          : undefined,
        views: attributes.views ?? 0,
        durationSec: attributes.durationSec ?? undefined,
        speakers,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const courseList: Course[] = (courses || [])
    .map((c): Course | null => {
      const attributes = extractAttributes<CourseAttributes>(c);
      if (!attributes) return null;

      const title = typeof attributes.name === "string" ? attributes.name : undefined;
      const slug = typeof attributes.slug === "string" ? attributes.slug : undefined;
      if (!title || !slug) return null;

      const coverMedia = extractSingleRelation<{ url?: string }>(attributes.cover);

      return {
        title,
        slug,
        description: typeof attributes.description === "string" ? attributes.description : undefined,
        coverUrl: typeof coverMedia?.url === "string" ? coverMedia.url : undefined,
      };
    })
    .filter((course): course is Course => course !== null)
    .slice(0, 3);

  const eventCards = (events || []).map((event) => {
    const attributes = extractAttributes<EventAttributes>(event);
    if (!attributes) {
      return {
        title: "Untitled Event",
        slug: "",
        description: undefined,
        location: undefined,
        date: undefined,
        cover: undefined,
      };
    }

    const coverMedia = extractSingleRelation<{ url?: string }>(attributes.cover);

    return {
      title: attributes.title ?? "Untitled Event",
      slug: attributes.slug ?? "",
      description: attributes.description,
      location: attributes.location,
      date: attributes.date || attributes.startDate,
      cover: typeof coverMedia?.url === "string" ? coverMedia.url : undefined,
    };
  });

  const featuredAttributes = extractAttributes<MediaAttributes>(featured);
  const featuredThumbnail = featuredAttributes
    ? extractSingleRelation<{ url?: string; alternativeText?: string }>(featuredAttributes.thumbnail)
    : undefined;
  const recommendationsEnabled = process.env.NEXT_PUBLIC_RECOMMENDATIONS_ENABLED === "true";

  return (
    <div className="space-y-16">
      <SEOHead jsonLd={organizationSchema} />
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 bg-gradient-to-r from-amber-500/20 via-rose-500/10 to-transparent px-6 py-16 shadow-2xl sm:px-10">
        <div className="relative z-10 max-w-3xl space-y-6">
          <span className="text-xs uppercase tracking-[0.4em] text-zinc-600 dark:text-white/70">Ruach Ministries</span>
          <h1 className="text-4xl font-semibold leading-tight text-zinc-900 dark:text-white sm:text-5xl">
            Ruach is a prophetic media ministry that forms, equips, and sends believers to carry freedom and establish Kingdom communities.
          </h1>
          <p className="text-lg text-zinc-700 dark:text-white/80">
            We tell testimonies, disciple believers in the Word and the gifts of the Spirit, and mobilize outreach teams—so what God does in private lives is carried into public places.
          </p>
          <div className="flex flex-wrap gap-3">
            <LocalizedLink
              href="/start"
            >
              <span className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400">
                Start Here
              </span>
            </LocalizedLink>
            <LocalizedLink
              href="/media"
            >
              <span className="rounded-full border border-zinc-300 dark:border-white/20 px-6 py-2.5 text-sm font-semibold text-zinc-800 dark:text-white/90 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
                Watch Testimonies
              </span>
            </LocalizedLink>
            <LocalizedLink
              href="/builders"
            >
              <span className="rounded-full border border-zinc-300 dark:border-white/20 px-6 py-2.5 text-sm font-semibold text-zinc-800 dark:text-white/90 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
                Join the Builders
              </span>
            </LocalizedLink>
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_40%),radial-gradient(circle_at_80%_40%,rgba(255,120,0,0.2),transparent_45%)]" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1.1fr]">
        <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8">
          <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">Mission Statement</div>
          <p className="mt-4 text-3xl font-bold text-center text-zinc-900 dark:text-white">
            Spirit-Led Media. Bold Truth. Kingdom Impact.
          </p>
          <p className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-white">
            Ruach Ministries exists to awaken sons and daughters to Jesus, equipping them in the Word and the gifts of the Spirit, so they can carry the breath of God into every sphere of culture.
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-surface p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Get Involved</h3>
          <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-white/80">
            Partner with Ruach as we disciple nations, cultivate community, and tell stories that unlock freedom.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <LocalizedLink href="/give">
              <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-2 font-semibold text-black transition hover:bg-amber-300">
                Become a Partner
              </span>
            </LocalizedLink>
            <LocalizedLink href="/builders">
              <span className="inline-flex items-center gap-1 text-amber-700 font-medium hover:text-amber-800 underline-offset-4 hover:underline">
                Join the Builders →
              </span>
            </LocalizedLink>
          </div>
        </div>
      </section>

      {featuredAttributes ? (
        <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 bg-white text-neutral-900 shadow-xl">
            <div className="relative aspect-video bg-neutral-200">
              {featuredThumbnail?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgUrl(featuredThumbnail.url)}
                  alt={featuredThumbnail.alternativeText ?? featuredAttributes.title ?? "Featured testimony"}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="space-y-3 p-8">
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Spotlight Testimony</span>
              <h2 className="text-2xl font-semibold text-neutral-900">{featuredAttributes.title}</h2>
              {featuredAttributes.description ? (
                <p className="text-neutral-600">{featuredAttributes.description}</p>
              ) : null}
              <LocalizedLink href={`/media/${featuredAttributes.slug}`}>
                <span className="inline-flex items-center text-sm font-semibold text-amber-700 hover:text-amber-600">Watch the story →</span>
              </LocalizedLink>
            </div>
          </div>
          <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-sm text-zinc-700 dark:text-white/80">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Why Stories Matter</h3>
            <p className="mt-3">
              Every testimony is a breath of the Spirit—evidence that Jesus is still setting captives free. Share these stories with friends who need hope.
            </p>
            <LocalizedLink
              href="/media"
            >
              <span className="mt-6 inline-flex items-center rounded-full border border-zinc-300 dark:border-white/20 px-5 py-2 font-semibold text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
                Explore the media library
              </span>
            </LocalizedLink>
          </div>
        </section>
      ) : null}

      {testimonyList.length ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">Featured Media</span>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">Testimonies of Freedom</h2>
            </div>
            <LocalizedLink href="/media">
              <span className="text-sm font-semibold text-amber-300 hover:text-amber-200">View all media →</span>
            </LocalizedLink>
          </div>
          <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white p-8 text-neutral-900">
            <MediaGrid items={testimonyList} />
          </div>
        </section>
      ) : null}

      {courseList.length ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">Featured Courses</span>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">Grow as a Disciple</h2>
            </div>
            <LocalizedLink href="/courses">
              <span className="text-sm font-semibold text-amber-300 hover:text-amber-200">Explore courses →</span>
            </LocalizedLink>
          </div>
          <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white p-8 text-neutral-900">
            <CourseGrid courses={courseList} />
          </div>
        </section>
      ) : null}

      {eventCards.length ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">Upcoming Events</span>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">Conferences & Gatherings</h2>
            </div>
            <LocalizedLink href="/conferences">
              <span className="text-sm font-semibold text-amber-300 hover:text-amber-200">See all conferences →</span>
            </LocalizedLink>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {eventCards.map((event) => (
              <div key={event.slug} className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5">
                <div className="relative aspect-[4/3] bg-white dark:bg-white/5">
                  {event.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgUrl(event.cover)!}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">
                    {event.date ? new Date(event.date).toLocaleDateString() : "Coming Soon"}
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{event.title}</h3>
                  {event.description ? (
                    <p className="text-sm text-zinc-600 dark:text-white/70">{event.description}</p>
                  ) : null}
                  {event.location ? (
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-white/50">
                      {event.location}
                    </div>
                  ) : null}
                  <div className="mt-auto">
                    <LocalizedLink
                      href={`/events/${event.slug}`}
                    >
                      <span className="inline-flex items-center rounded-full border border-zinc-300 dark:border-white/20 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
                        View details
                      </span>
                    </LocalizedLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {recommendationsEnabled ? (
        <Suspense fallback={null}>
          <RecommendedForYou limit={6} />
        </Suspense>
      ) : null}

      {/* Builder Callout - Carry the Fire */}
      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">For Builders & Senders</span>
          <h2 className="text-2xl font-semibold">Some Are Called Beyond Participation</h2>
          <p className="text-sm text-zinc-600 dark:text-white/70">
            If you sense God is calling you not just to follow Ruach, but to replicate, lead, or carry what He&apos;s doing into your city—we want to equip and send you.
          </p>
          <LocalizedLink href="/carry">
            <span className="inline-flex items-center rounded-full border border-zinc-300 dark:border-white/20 px-5 py-2 text-sm font-semibold text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
              Discover the Builder Pathway →
            </span>
          </LocalizedLink>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto flex flex-col gap-6 rounded-3xl border border-subtle bg-surface p-10 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-amber-100 dark:text-amber-100">Partner With Us</span>
            <h2 className="text-3xl font-semibold text-primary dark:text-white">
              Help us disciple nations and tell stories that release freedom.
            </h2>
            <p className="text-sm text-secondary font-medium dark:text-white/80">
              Your giving fuels media production, conferences, and community outreach that ushers people into encounters with Jesus.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LocalizedLink href="/give">
            <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-amber-300 dark:bg-amber-500/90 dark:hover:bg-amber-400">
                Give a One-Time Gift
              </span>
            </LocalizedLink>
            <LocalizedLink href="/give#partner">
            <span className="inline-flex items-center justify-center rounded-full border border-amber-200/70 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-amber-100 dark:border-amber-300 dark:text-amber-50 dark:hover:border-amber-200">
                Become a Monthly Partner
              </span>
            </LocalizedLink>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white p-10 text-neutral-900">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,1fr]">
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-wide text-neutral-500">Stay in the Flow</span>
            <h2 className="text-3xl font-semibold text-neutral-900">Subscribe for testimonies, courses, and event updates.</h2>
            <p className="text-neutral-600">
              You will receive monthly stories, discipleship resources, and opportunities to serve alongside Ruach Ministries.
            </p>
          </div>
          <NewsletterSignup variant="light" id="home-newsletter" buttonLabel="Subscribe" />
        </div>
      </section>
    </div>
  );
}
