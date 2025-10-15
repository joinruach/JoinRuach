import Link from "next/link";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import CourseGrid from "@ruach/components/components/ruach/CourseGrid";
import type { Course } from "@ruach/components/components/ruach/CourseCard";
import NewsletterSignup from "@/components/ruach/NewsletterSignup";
import SEOHead from "@/components/ruach/SEOHead";
import { getCourses, getMediaByCategory } from "@/lib/strapi";
import type { MediaItemEntity } from "@/lib/types/strapi-types";

export const dynamic = "force-static";
export const revalidate = 180;

export const metadata = {
  title: "Resource Hub — Media, Courses, and Ministry Tools | Ruach Ministries",
  description:
    "Explore Ruach Ministries resources: testimonies, discipleship courses, outreach toolkits, and partner downloads designed to equip your church.",
  openGraph: {
    title: "Resource Hub — Media, Courses, and Ministry Tools",
    description:
      "Discover media, discipleship training, and outreach resources curated by Ruach Ministries to equip believers.",
  },
};

type ResourcePath = {
  tag: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

type DownloadHighlight = {
  title: string;
  description: string;
  badge: string;
  href: string;
  cta: string;
};

function mapMediaItem(entity: MediaItemEntity | null | undefined): MediaCardProps | null {
  const attributes = entity?.attributes;
  if (!attributes) return null;

  const slug = attributes.slug;
  if (typeof slug !== "string" || !slug.trim()) return null;

  const title = typeof attributes.title === "string" && attributes.title.trim()
    ? attributes.title
    : "Untitled Media";

  const excerpt =
    typeof attributes.excerpt === "string" && attributes.excerpt.trim()
      ? attributes.excerpt
      : typeof attributes.description === "string" && attributes.description.trim()
        ? attributes.description
        : undefined;

  const thumbnailAttributes = attributes.thumbnail?.data?.attributes;
  const thumbnail = thumbnailAttributes?.url
    ? {
        src: thumbnailAttributes.url ?? undefined,
        alt: thumbnailAttributes.alternativeText ?? title,
      }
    : undefined;

  const speakers = Array.isArray(attributes.speakers?.data)
    ? attributes.speakers.data
        .map((speaker) => speaker?.attributes?.name)
        .filter((name): name is string => Boolean(name && name.trim()))
    : undefined;

  return {
    title,
    href: `/media/${slug}`,
    excerpt,
    category: attributes.category?.data?.attributes?.name ?? attributes.legacyCategory ?? undefined,
    thumbnail,
    views: typeof attributes.views === "number" ? attributes.views : undefined,
    durationSec: typeof attributes.durationSec === "number" ? attributes.durationSec : undefined,
    speakers,
  };
}

function normalizeCourses(items: unknown[]): Course[] {
  return items
    .map((item) => {
      const attributes = (item as { attributes?: Record<string, unknown> } | undefined)?.attributes;
      if (!attributes) return null;

      const title = attributes.title;
      const slug = attributes.slug;
      if (typeof title !== "string" || typeof slug !== "string") return null;

      const description = attributes.description;
      const coverUrl = (attributes as { cover?: { data?: { attributes?: { url?: string } } } }).cover
        ?.data?.attributes?.url;

      const course: Course = {
        title,
        slug,
        ...(typeof description === "string" ? { description } : {}),
        ...(typeof coverUrl === "string" ? { coverUrl } : {}),
      };

      return course;
    })
    .filter((course): course is Course => Boolean(course));
}

export default async function ResourcesPage() {
  const [teachingItems, testimonyItems, courseItems] = await Promise.all([
    getMediaByCategory("teaching", 6).catch(() => [] as MediaItemEntity[]),
    getMediaByCategory("testimony", 6).catch(() => [] as MediaItemEntity[]),
    getCourses().catch(() => []),
  ]);

  const teachings = (teachingItems || [])
    .map((item) => mapMediaItem(item))
    .filter((item): item is MediaCardProps => Boolean(item))
    .slice(0, 3);

  const testimonies = (testimonyItems || [])
    .map((item) => mapMediaItem(item))
    .filter((item): item is MediaCardProps => Boolean(item))
    .slice(0, 3);

  const courses = normalizeCourses(courseItems).slice(0, 3);

  const resourcePaths: ResourcePath[] = [
    {
      tag: "Watch",
      title: "Media & Testimonies",
      description:
        "Share cinematic freedom stories and teachings that stir faith for deliverance and revival in your community.",
      href: "/media",
      cta: "Browse the media library",
    },
    {
      tag: "Learn",
      title: "Ruach Academy",
      description:
        "Stream discipleship series on deliverance, evangelism, and living led by the Spirit with activation assignments.",
      href: "/courses",
      cta: "Explore courses",
    },
    {
      tag: "Activate",
      title: "Outreach Playbooks",
      description:
        "Equip teams with street ministry frameworks, testimonies, and prayer tools to host Jesus-centered encounters.",
      href: "/community-outreach",
      cta: "Plan your outreach",
    },
    {
      tag: "Partner",
      title: "Member Library",
      description:
        "Unlock partner-only downloads, posts, and podcasts crafted to keep your church resourced for ongoing revival.",
      href: "/members/downloads",
      cta: "See partner resources",
    },
  ];

  const downloadHighlights: DownloadHighlight[] = [
    {
      title: "Freedom Foundations Study Guide",
      description:
        "A printable guide covering identity, repentance, and staying free—ideal for small groups or deliverance teams.",
      badge: "Partner download",
      href: "/members/downloads",
      cta: "Access the guide",
    },
    {
      title: "Street Ministry Conversation Cards",
      description:
        "Prompts and Scriptures to launch conversations about Jesus in neighborhoods, campuses, and city centers.",
      badge: "Free resource",
      href: "/community-outreach",
      cta: "Download the cards",
    },
    {
      title: "Testimony Release Checklist",
      description:
        "A step-by-step workflow for capturing, vetting, and sharing testimonies that honor people and glorify Jesus.",
      badge: "Team toolkit",
      href: "/media",
      cta: "Use the checklist",
    },
  ];

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://joinruach.org";
  const resourceSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ruach Ministries Resource Hub",
    url: `${site}/resources`,
    description:
      "Ruach Ministries resources that equip believers with testimonies, discipleship courses, outreach guides, and partner downloads.",
    publisher: {
      "@type": "Organization",
      name: "Ruach Ministries",
      url: site,
    },
    hasPart: [
      {
        "@type": "CreativeWorkSeries",
        name: "Media & Testimonies",
        url: `${site}/media`,
      },
      {
        "@type": "CreativeWorkSeries",
        name: "Ruach Academy Courses",
        url: `${site}/courses`,
      },
      {
        "@type": "CreativeWorkSeries",
        name: "Outreach Resources",
        url: `${site}/community-outreach`,
      },
      {
        "@type": "CreativeWorkSeries",
        name: "Partner Library",
        url: `${site}/members/downloads`,
      },
    ],
  };

  return (
    <div className="space-y-12">
      <SEOHead jsonLd={resourceSchema} />

      <section className="rounded-3xl border border-white/10 bg-white/5 p-10 text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-white/60">Resource Hub</span>
        <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
          Equip believers with stories, teaching, and tools that carry the breath of God.
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          Whether you are discipling a small group, training an outreach team, or curating testimonies for your church,
          these resources help you point people to Jesus and steward revival responsibly.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/media"
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
          >
            Watch testimonies
          </Link>
          <Link
            href="/courses"
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
          >
            Explore courses
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
          >
            Join partner community
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {resourcePaths.map((item) => (
          <article
            key={item.href}
            className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 text-white"
          >
            <span className="text-xs uppercase tracking-[0.35em] text-white/60">{item.tag}</span>
            <h2 className="mt-3 text-lg font-semibold text-white">{item.title}</h2>
            <p className="mt-2 text-sm text-white/70">{item.description}</p>
            <Link
              href={item.href}
              className="mt-6 inline-flex items-center text-sm font-semibold text-amber-300 transition hover:text-amber-200"
            >
              {item.cta} →
            </Link>
          </article>
        ))}
      </section>

      <section className="space-y-10">
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white">Featured teachings</h2>
            <Link href="/media?category=teaching" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
              View all teachings →
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white p-8 text-neutral-900">
            {teachings.length ? (
              <MediaGrid items={teachings} />
            ) : (
              <p className="text-sm text-neutral-600">
                Teaching resources are being updated. Explore the{" "}
                <Link href="/media" className="font-semibold text-neutral-900 underline">
                  full media library
                </Link>{" "}
                for the latest content.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white">Freedom stories you can share</h2>
            <Link href="/media?category=testimony" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
              View all testimonies →
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
            {testimonies.length ? (
              <MediaGrid items={testimonies} />
            ) : (
              <p className="text-sm text-white/70">
                Testimonies are coming soon. Follow us on social or subscribe below to hear when new stories release.
              </p>
            )}
          </div>
        </div>
      </section>

      {courses.length ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white">Discipleship courses</h2>
            <Link href="/courses" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
              Browse all courses →
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white p-8 text-neutral-900">
            <CourseGrid courses={courses} />
          </div>
        </section>
      ) : null}

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Downloads &amp; toolkits</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {downloadHighlights.map((item) => (
            <article
              key={item.href}
              className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 text-white"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-200">{item.badge}</span>
              <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-white/70">{item.description}</p>
              <Link
                href={item.href}
                className="mt-6 inline-flex items-center text-sm font-semibold text-amber-300 transition hover:text-amber-200"
              >
                {item.cta} →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Support for ministry leaders</h2>
          <p className="text-sm text-white/70">
            Need Ruach to train your team or help host a testimony night? We can provide outlines, prayer guides, and
            guest speakers to strengthen what God is doing in your city.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-white/70">
            <li>Templates for pre-service prayer and altar team training</li>
            <li>Event promotion kits with graphics, copy, and follow-up flows</li>
            <li>Coaching calls to launch deliverance and evangelism teams</li>
          </ul>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
          >
            Request leader support
          </Link>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white p-6 text-neutral-900">
          <h3 className="text-lg font-semibold text-neutral-900">Host Ruach at your church</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Share a few details about your gathering and what your team needs. We review every request and respond within
            a few days.
          </p>
          <Link
            href="/events"
            className="mt-6 inline-flex items-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            View upcoming events
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-amber-500/20 via-rose-500/10 to-transparent p-8 text-white">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.35em] text-white/60">Stay resourced</span>
            <h2 className="text-2xl font-semibold text-white">Get fresh testimonies and tools by email</h2>
            <p className="text-sm text-white/80">
              Monthly stories, practical outreach tips, and course releases delivered to your inbox so you can keep
              equipping your community.
            </p>
          </div>
          <NewsletterSignup variant="dark" />
        </div>
      </section>
    </div>
  );
}
