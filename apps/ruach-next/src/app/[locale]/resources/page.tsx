import Image from "next/image";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import CourseGrid from "@ruach/components/components/ruach/CourseGrid";
import type { Course } from "@ruach/components/components/ruach/CourseCard";
import NewsletterSignup from "@/components/ruach/NewsletterSignup";
import SEOHead from "@/components/ruach/SEOHead";
import TrackedLink from "@/components/ruach/TrackedLink";
import {
  getArticles,
  getBlogPosts,
  getCourses,
  getLessons,
  getMediaByCategory,
  getResourceDirectory,
  imgUrl,
  type ArticleEntity,
  type BlogPostEntity,
  type LessonEntity,
  type ResourceDirectory,
  type ResourceHighlight,
  type ResourceLinkComponent,
  type ResourceSection,
  type ResourceSectionType,
} from "@/lib/strapi";
import type { MediaItemEntity } from "@/lib/types/strapi-types";
import {
  extractAttributes,
  extractManyRelation,
  extractSingleRelation,
} from "@/lib/strapi-normalize";

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

type LessonResourceLink = {
  id?: number;
  label?: string | null;
  url: string;
  requiresLogin: boolean;
  type?: ResourceLinkComponent["type"] | null;
};

type LessonDownload = {
  id: number;
  title: string;
  summary?: string | null;
  courseTitle?: string | null;
  categoryName?: string | null;
  resources: LessonResourceLink[];
};

type ArticleCard = {
  id: string;
  title: string;
  href?: string;
  summary?: string | null;
  image?: { src?: string; alt?: string | null };
  label?: string | null;
};

type CustomResourceCard = {
  id?: number;
  label: string;
  url: string;
  requiresLogin: boolean;
  type?: ResourceLinkComponent["type"] | null;
};

type BaseSectionData = {
  id: number;
  title: string;
  description?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  tag?: string | null;
  image?: { url?: string; alternativeText?: string | null } | null;
};

type SectionRenderData =
  | (BaseSectionData & { type: "media"; items: MediaCardProps[] })
  | (BaseSectionData & { type: "lesson"; items: LessonDownload[] })
  | (BaseSectionData & { type: "article"; items: ArticleCard[] })
  | (BaseSectionData & { type: "course"; items: Course[] })
  | (BaseSectionData & { type: "custom"; items: CustomResourceCard[] });

type NormalizedResourceDirectory = Omit<ResourceDirectory, "highlights" | "sections" | "heroCopy" | "title" | "featuredMediaItems" | "featuredLessons" | "featuredArticles" | "featuredBlogPosts"> & {
  title: string;
  heroCopy: string;
  highlights: ResourceHighlight[];
  sections: ResourceSection[];
  featuredMediaItems: MediaItemEntity[];
  featuredLessons: LessonEntity[];
  featuredArticles: ArticleEntity[];
  featuredBlogPosts: BlogPostEntity[];
};

const DEFAULT_HERO_COPY = `<p>Whether you are discipling a small group, training an outreach team, or curating testimonies for your church, these resources help you point people to Jesus and steward revival responsibly.</p>`;

const DEFAULT_HIGHLIGHTS: ResourceHighlight[] = [
  {
    id: 1,
    eyebrow: "Watch",
    title: "Media & Testimonies",
    description: "Share cinematic freedom stories and teachings that stir faith for deliverance and revival in your community.",
    ctaLabel: "Browse the media library",
    ctaUrl: "/media",
    accentColor: "#fbbf24",
  },
  {
    id: 2,
    eyebrow: "Learn",
    title: "Ruach Academy",
    description: "Stream discipleship series on deliverance, evangelism, and Spirit-led living with activation assignments.",
    ctaLabel: "Explore courses",
    ctaUrl: "/courses",
    accentColor: "#f97316",
  },
  {
    id: 3,
    eyebrow: "Activate",
    title: "Outreach Playbooks",
    description: "Equip teams with street ministry frameworks, testimonies, and prayer tools to host Jesus-centered encounters.",
    ctaLabel: "Plan your outreach",
    ctaUrl: "/community-outreach",
    accentColor: "#fb7185",
  },
  {
    id: 4,
    eyebrow: "Partner",
    title: "Member Library",
    description: "Unlock partner-only downloads, posts, and podcasts crafted to keep your church resourced for ongoing revival.",
    ctaLabel: "See partner resources",
    ctaUrl: "/members/downloads",
    accentColor: "#e879f9",
  },
];

const DEFAULT_SECTIONS: ResourceSection[] = [
  {
    id: 1,
    title: "Featured teachings",
    description: "Fresh equipping for deliverance and discipleship ready to share with your house churches, teams, and friends.",
    ctaLabel: "View all teachings →",
    ctaUrl: "/media?category=teaching",
    type: "media",
    categoryName: "Teaching",
    categorySlug: "teaching",
    tag: null,
    image: null,
    highlightedMediaItems: [],
    highlightedLessons: [],
    highlightedArticles: [],
    highlightedCourses: [],
    highlightedBlogPosts: [],
    customResources: [],
  },
  {
    id: 2,
    title: "Freedom stories you can share",
    description: "Showcase testimonies that spark faith for deliverance, healing, and salvation in your community.",
    ctaLabel: "View all testimonies →",
    ctaUrl: "/media?category=testimony",
    type: "media",
    categoryName: "Testimony",
    categorySlug: "testimony",
    tag: null,
    image: null,
    highlightedMediaItems: [],
    highlightedLessons: [],
    highlightedArticles: [],
    highlightedCourses: [],
    highlightedBlogPosts: [],
    customResources: [],
  },
  {
    id: 3,
    title: "Discipleship courses",
    description: "Cinematic series with activation assignments that equip believers to carry the breath of God everywhere.",
    ctaLabel: "Browse all courses →",
    ctaUrl: "/courses",
    type: "course",
    categoryName: null,
    categorySlug: null,
    tag: null,
    image: null,
    highlightedMediaItems: [],
    highlightedLessons: [],
    highlightedArticles: [],
    highlightedCourses: [],
    highlightedBlogPosts: [],
    customResources: [],
  },
  {
    id: 4,
    title: "Ruach blog insights",
    description: "Stories, guides, and testimonies from the field to help you lead Spirit-filled communities.",
    ctaLabel: "Read the blog →",
    ctaUrl: "/blog",
    type: "article",
    categoryName: null,
    categorySlug: null,
    tag: "blog",
    image: null,
    highlightedMediaItems: [],
    highlightedLessons: [],
    highlightedArticles: [],
    highlightedCourses: [],
    highlightedBlogPosts: [],
    customResources: [],
  },
  {
    id: 5,
    title: "Downloads & toolkits",
    description: "Printable study guides, outreach prompts, and planning checklists you can hand to your teams today.",
    ctaLabel: "Partner login →",
    ctaUrl: "/signup",
    type: "custom",
    categoryName: null,
    categorySlug: null,
    tag: null,
    image: null,
    highlightedMediaItems: [],
    highlightedLessons: [],
    highlightedArticles: [],
    highlightedCourses: [],
    highlightedBlogPosts: [],
    customResources: [
      {
        id: 1,
        label: "Freedom Foundations Study Guide",
        url: "/members/downloads",
        requiresLogin: true,
        type: "download",
      },
      {
        id: 2,
        label: "Street Ministry Conversation Cards",
        url: "/community-outreach",
        requiresLogin: false,
        type: "external",
      },
      {
        id: 3,
        label: "Testimony Release Checklist",
        url: "/media",
        requiresLogin: false,
        type: "notes",
      },
    ],
  },
];

const DEFAULT_DIRECTORY: NormalizedResourceDirectory = {
  id: null,
  title: "Resource Hub",
  heroCopy: DEFAULT_HERO_COPY,
  seo: null,
  highlights: DEFAULT_HIGHLIGHTS,
  sections: DEFAULT_SECTIONS,
  featuredMediaItems: [],
  featuredLessons: [],
  featuredArticles: [],
  featuredBlogPosts: [],
};

export default async function ResourcesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await params (Next.js 15 requirement)
  await params;

  const resourceDirectory = await getResourceDirectory().catch(() => null);
  const directory = normalizeResourceDirectory(resourceDirectory);

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://joinruach.org";
  const heroTitle = directory.title || "Resource Hub";
  const heroCopyHtml = directory.heroCopy?.trim() ? directory.heroCopy : DEFAULT_HERO_COPY;

  let cachedCourses: Course[] | null = null;
  let cachedBlogPosts: BlogPostEntity[] | null = null;

  const sectionsWithData = await Promise.all(
    directory.sections.map(async (section) =>
      resolveSection(section, directory, {
        getCourses: async () => {
          if (cachedCourses) return cachedCourses;
          const rawCourses = await getCourses();
          cachedCourses = normalizeCourses(rawCourses).slice(0, 6);
          return cachedCourses;
        },
        getBlogPosts: async () => {
          if (cachedBlogPosts) return cachedBlogPosts;
          const { data } = await getBlogPosts({ pageSize: 6 });
          cachedBlogPosts = data || [];
          return cachedBlogPosts;
        },
      })
    )
  );

  const filteredSections = sectionsWithData.filter(
    (section): section is SectionRenderData => Boolean(section && (section.items.length || section.type === "custom"))
  );

  const shareDescription =
    directory.seo?.metaDescription ||
    stripHtml(heroCopyHtml) ||
    "Ruach Ministries resources that equip believers with testimonies, discipleship courses, outreach guides, and partner downloads.";

  const resourceSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: heroTitle,
    url: `${site}/resources`,
    description: shareDescription,
    publisher: {
      "@type": "Organization",
      name: "Ruach Ministries",
      url: site,
    },
    hasPart: filteredSections
      .filter((section) => section.items.length > 0)
      .map((section) => ({
        "@type": "CreativeWorkSeries",
        name: section.title,
        ...(section.ctaUrl ? { url: ensureAbsoluteUrl(section.ctaUrl, site) } : {}),
      })),
  };

  return (
    <div className="space-y-12">
      <SEOHead jsonLd={resourceSchema} />

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-10 text-zinc-900 dark:text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Resource Hub</span>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white sm:text-4xl">{heroTitle}</h1>
        <div
          className="mt-3 max-w-3xl text-sm text-zinc-700 dark:text-white/80 space-y-3 [&>p]:m-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mt-1"
          dangerouslySetInnerHTML={{ __html: heroCopyHtml }}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <LocalizedLink href="/media">
            <span className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-300">
              Watch testimonies
            </span>
          </LocalizedLink>
          <LocalizedLink href="/courses">
            <span className="rounded-full border border-zinc-300 dark:border-white/20 px-5 py-2 text-sm font-semibold text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
              Explore courses
            </span>
          </LocalizedLink>
          <LocalizedLink href="/signup">
            <span className="rounded-full border border-zinc-300 dark:border-white/20 px-5 py-2 text-sm font-semibold text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
              Join partner community
            </span>
          </LocalizedLink>
        </div>
      </section>

      {directory.highlights.length ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {directory.highlights.map((highlight) => (
            <article
              key={highlight.id}
              className="flex h-full flex-col rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 text-zinc-900 dark:text-white transition hover:border-amber-300 hover:bg-white dark:hover:bg-white/10"
              style={highlight.accentColor ? { borderColor: `${highlight.accentColor}33` } : undefined}
            >
              {highlight.eyebrow ? (
                <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">{highlight.eyebrow}</span>
              ) : null}
              <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-white">{highlight.title}</h2>
              {highlight.description ? (
                <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">{highlight.description}</p>
              ) : null}
              {highlight.ctaLabel && highlight.ctaUrl ? (
                <LocalizedLink href={highlight.ctaUrl}>
                  <span className="mt-6 inline-flex items-center text-sm font-semibold text-amber-300 transition hover:text-amber-200">
                    {highlight.ctaLabel} →
                  </span>
                </LocalizedLink>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {filteredSections.map((section) => renderSection(section))}

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-gradient-to-r from-amber-500/20 via-rose-500/10 to-transparent p-8 text-zinc-900 dark:text-white">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Stay resourced</span>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Get fresh testimonies and tools by email</h2>
            <p className="text-sm text-zinc-700 dark:text-white/80">
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

function normalizeResourceDirectory(resource: ResourceDirectory | null): NormalizedResourceDirectory {
  if (!resource) {
    return DEFAULT_DIRECTORY;
  }

  return {
    id: resource.id ?? null,
    title: (resource.title && resource.title.trim()) || DEFAULT_DIRECTORY.title,
    heroCopy: resource.heroCopy?.trim() || DEFAULT_DIRECTORY.heroCopy,
    seo: resource.seo ?? null,
    highlights: resource.highlights.length ? resource.highlights : DEFAULT_HIGHLIGHTS,
    sections: resource.sections.length ? resource.sections : DEFAULT_SECTIONS,
    featuredMediaItems: resource.featuredMediaItems ?? [],
    featuredLessons: resource.featuredLessons ?? [],
    featuredArticles: resource.featuredArticles ?? [],
    featuredBlogPosts: resource.featuredBlogPosts ?? [],
  };
}

async function resolveSection(
  section: ResourceSection,
  directory: NormalizedResourceDirectory,
  loaders: {
    getCourses: () => Promise<Course[]>;
    getBlogPosts: () => Promise<BlogPostEntity[]>;
  }
): Promise<SectionRenderData | null> {
  const base: BaseSectionData = {
    id: section.id,
    title: section.title,
    description: section.description ?? null,
    ctaLabel: section.ctaLabel ?? null,
    ctaUrl: section.ctaUrl ?? null,
    categoryName: section.categoryName ?? null,
    categorySlug: section.categorySlug ?? null,
    tag: section.tag ?? null,
    image: section.image ?? null,
  };

  switch (section.type) {
    case "media": {
      const items = await resolveMediaItems(section, directory);
      return { ...base, type: "media", items };
    }
    case "lesson": {
      const items = await resolveLessonDownloads(section, directory);
      return { ...base, type: "lesson", items };
    }
    case "article": {
      const items = await resolveArticleCards(section, directory, loaders);
      return { ...base, type: "article", items };
    }
    case "course": {
      const items = await resolveCourseCards(section, loaders);
      return { ...base, type: "course", items };
    }
    case "custom":
    default: {
      const items = resolveCustomResources(section);
      return { ...base, type: "custom", items };
    }
  }
}

async function resolveMediaItems(
  section: ResourceSection,
  directory: NormalizedResourceDirectory
): Promise<MediaCardProps[]> {
  let items = section.highlightedMediaItems;
  if (!items.length && directory.featuredMediaItems.length) {
    items = directory.featuredMediaItems;
  }
  if (!items.length && section.categorySlug) {
    const fetched = await getMediaByCategory(section.categorySlug, 9).catch(() => [] as MediaItemEntity[]);
    items = fetched;
  }

  return items
    .map((item) => mapMediaItem(item))
    .filter((item): item is MediaCardProps => Boolean(item))
    .slice(0, 9);
}

async function resolveLessonDownloads(
  section: ResourceSection,
  directory: NormalizedResourceDirectory
): Promise<LessonDownload[]> {
  let lessons = section.highlightedLessons;
  if (!lessons.length && directory.featuredLessons.length) {
    lessons = directory.featuredLessons;
  }
  if (!lessons.length && section.categorySlug) {
    lessons = await getLessons({ categorySlug: section.categorySlug, limit: 6 }).catch(() => [] as LessonEntity[]);
  }

  return lessons
    .map((lesson) => mapLessonDownload(lesson))
    .filter((lesson): lesson is LessonDownload => Boolean(lesson))
    .slice(0, 6);
}

async function resolveArticleCards(
  section: ResourceSection,
  directory: NormalizedResourceDirectory,
  loaders: {
    getBlogPosts: () => Promise<BlogPostEntity[]>;
  }
): Promise<ArticleCard[]> {
  const collected: ArticleCard[] = [];
  const preferBlogPosts = section.tag === "blog";

  const highlightedArticles = section.highlightedArticles
    .map((article) => mapArticleEntity(article))
    .filter((article): article is ArticleCard => Boolean(article));
  collected.push(...highlightedArticles);

  const highlightedBlogPosts = section.highlightedBlogPosts
    .map((post) => mapBlogPostEntity(post))
    .filter((post): post is ArticleCard => Boolean(post));
  collected.push(...highlightedBlogPosts);

  if (!collected.length && directory.featuredArticles.length) {
    collected.push(
      ...directory.featuredArticles
        .map((article) => mapArticleEntity(article))
        .filter((article): article is ArticleCard => Boolean(article))
    );
  }

  if (!collected.length && directory.featuredBlogPosts.length) {
    collected.push(
      ...directory.featuredBlogPosts
        .map((post) => mapBlogPostEntity(post))
        .filter((post): post is ArticleCard => Boolean(post))
    );
  }

  if (!collected.length) {
    if (!preferBlogPosts) {
      const fetchedArticles = await getArticles({
        categorySlug: section.categorySlug ?? undefined,
        limit: 6,
      }).catch(() => [] as ArticleEntity[]);
      collected.push(
        ...fetchedArticles
          .map((article) => mapArticleEntity(article))
          .filter((article): article is ArticleCard => Boolean(article))
      );
    } else {
      const posts = await loaders.getBlogPosts();
      collected.push(
        ...posts
          .map((post) => mapBlogPostEntity(post))
          .filter((post): post is ArticleCard => Boolean(post))
      );
    }
  }

  if (!collected.length) {
    if (preferBlogPosts) {
      const fallbackArticles = await getArticles({
        categorySlug: section.categorySlug ?? undefined,
        limit: 6,
      }).catch(() => [] as ArticleEntity[]);
      collected.push(
        ...fallbackArticles
          .map((article) => mapArticleEntity(article))
          .filter((article): article is ArticleCard => Boolean(article))
      );
    } else {
      const posts = await loaders.getBlogPosts();
      collected.push(
        ...posts
          .map((post) => mapBlogPostEntity(post))
          .filter((post): post is ArticleCard => Boolean(post))
      );
    }
  }

  const unique = new Map<string, ArticleCard>();
  for (const card of collected) {
    unique.set(card.id, card);
  }

  return Array.from(unique.values()).slice(0, 9);
}

async function resolveCourseCards(
  section: ResourceSection,
  loaders: {
    getCourses: () => Promise<Course[]>;
  }
): Promise<Course[]> {
  const highlighted = normalizeCourses(section.highlightedCourses).slice(0, 6);
  if (highlighted.length) {
    return highlighted;
  }

  return (await loaders.getCourses()).slice(0, 6);
}

function resolveCustomResources(section: ResourceSection): CustomResourceCard[] {
  const customResources = section.customResources ?? [];
  const cards: CustomResourceCard[] = [];

  for (const resource of customResources) {
    if (!resource) continue;
    const label = typeof resource.label === "string" ? resource.label.trim() : "";
    const url = typeof resource.url === "string" ? resource.url.trim() : "";
    if (!label || !url) continue;

    cards.push({
      id: typeof resource.id === "number" ? resource.id : undefined,
      label,
      url,
      requiresLogin: Boolean(resource.requiresLogin),
      type: resource.type ?? null,
    });
  }

  return cards;
}

function renderSection(section: SectionRenderData) {
  switch (section.type) {
    case "media":
      return (
        <section key={section.id} className="space-y-6">
          <SectionHeading section={section} />
          <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white p-8 text-neutral-900">
            {section.items.length ? (
              <MediaGrid items={section.items} />
            ) : (
              <p className="text-sm text-neutral-600">Media will appear here soon. Check back shortly.</p>
            )}
          </div>
        </section>
      );
    case "lesson":
      return (
        <section key={section.id} className="space-y-6">
          <SectionHeading section={section} />
          <div className="grid gap-6 md:grid-cols-2">
            {section.items.length ? (
              section.items.map((item) => <LessonCard key={item.id} lesson={item} />)
            ) : (
              <p className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-sm text-zinc-600 dark:text-white/70">
                Downloadable resources will appear once they are published.
              </p>
            )}
          </div>
        </section>
      );
    case "article":
      return (
        <section key={section.id} className="space-y-6">
          <SectionHeading section={section} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {section.items.length ? (
              section.items.map((item) => <ArticleCardView key={item.id} article={item} />)
            ) : (
              <p className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-sm text-zinc-600 dark:text-white/70">
                Toolkits and articles are coming soon. Subscribe below to hear when they launch.
              </p>
            )}
          </div>
        </section>
      );
    case "course":
      return (
        <section key={section.id} className="space-y-6">
          <SectionHeading section={section} />
          <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white p-8 text-neutral-900">
            {section.items.length ? (
              <CourseGrid courses={section.items} />
            ) : (
              <p className="text-sm text-neutral-600">Courses will be published soon. Stay tuned!</p>
            )}
          </div>
        </section>
      );
    case "custom":
      return (
        <section key={section.id} className="space-y-6">
          <SectionHeading section={section} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {section.items.length ? (
              section.items.map((item) => <CustomResourceCardView key={item.id ?? item.label} resource={item} />)
            ) : (
              <p className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-sm text-zinc-600 dark:text-white/70">
                Add custom resource links in Strapi to populate this section.
              </p>
            )}
          </div>
        </section>
      );
    default:
      return null;
  }
}

function SectionHeading({
  section,
}: {
  section: BaseSectionData & { type: ResourceSectionType; ctaLabel?: string | null; ctaUrl?: string | null };
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{section.title}</h2>
        {section.description ? <p className="text-sm text-zinc-600 dark:text-white/70">{section.description}</p> : null}
      </div>
      {section.ctaLabel && section.ctaUrl ? (
        <LocalizedLink href={section.ctaUrl}>
          <span className="text-sm font-semibold text-amber-300 hover:text-amber-200">{section.ctaLabel}</span>
        </LocalizedLink>
      ) : null}
    </div>
  );
}

function LessonCard({ lesson }: { lesson: LessonDownload }) {
  const primaryResource = lesson.resources[0];
  const secondary = lesson.resources.slice(1);
  const isExternal = primaryResource?.url?.startsWith("http");
  const requiresLogin = Boolean(primaryResource?.requiresLogin);

  return (
    <article className="flex h-full flex-col rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 text-zinc-900 dark:text-white">
      <div className="space-y-2">
        {lesson.courseTitle ? (
          <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/50">{lesson.courseTitle}</span>
        ) : null}
        <h3 className="text-lg font-semibold">{lesson.title}</h3>
        {lesson.summary ? <p className="text-sm text-zinc-600 dark:text-white/70">{lesson.summary}</p> : null}
        {lesson.categoryName ? (
          <p className="text-xs uppercase tracking-wide text-zinc-400 dark:text-white/40">{lesson.categoryName}</p>
        ) : null}
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {primaryResource ? (
          <TrackedLink
            href={primaryResource.url}
            className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            event="ResourceLessonPrimaryClick"
            eventProps={{ title: lesson.title }}
          >
            {primaryResource.label || "Open resource"}
            {requiresLogin ? <span className="ml-2 text-xs uppercase text-black/70">Partners</span> : null}
          </TrackedLink>
        ) : (
          <span className="text-sm text-zinc-500 dark:text-white/60">Resources coming soon.</span>
        )}
        {secondary.length ? (
          <div className="space-y-1 text-xs text-zinc-500 dark:text-white/60">
            {secondary.map((resource, index) => (
              <div key={`${resource.id ?? resource.url}-${index}`} className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-300" aria-hidden />
                <a
                  href={resource.url}
                  className="underline decoration-dotted underline-offset-2 hover:text-amber-200"
                  target={resource.url.startsWith("http") ? "_blank" : undefined}
                  rel={resource.url.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {resource.label || "Additional resource"}
                </a>
                {resource.requiresLogin ? <span className="text-[10px] uppercase text-zinc-400 dark:text-white/40">Partners</span> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ArticleCardView({ article }: { article: ArticleCard }) {
  const imageSrc = article.image?.src ? imgUrl(article.image.src) : undefined;
  const href = article.href || "#";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-900 dark:text-white">
      <div className="relative aspect-[4/3] bg-white dark:bg-white/10">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={article.image?.alt || article.title}
            fill
            sizes="(min-width: 1280px) 360px, (min-width: 768px) 45vw, 90vw"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {article.label ? (
          <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">{article.label}</span>
        ) : null}
        <h3 className="mt-2 text-lg font-semibold">{article.title}</h3>
        {article.summary ? <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">{article.summary}</p> : null}
        {article.href ? (
          <LocalizedLink href={href}>
            <span className="mt-6 inline-flex items-center text-sm font-semibold text-amber-300 hover:text-amber-200">
              Read resource →
            </span>
          </LocalizedLink>
        ) : null}
      </div>
    </article>
  );
}

function CustomResourceCardView({ resource }: { resource: CustomResourceCard }) {
  const isExternal = resource.url.startsWith("http");
  return (
    <article className="flex h-full flex-col rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 text-zinc-900 dark:text-white transition hover:border-amber-300">
      <h3 className="text-lg font-semibold">{resource.label}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-white/50">
        {resource.type ? <span>{resource.type}</span> : null}
        {resource.requiresLogin ? <span className="rounded-full border border-zinc-300/80 dark:border-white/30 px-2 py-0.5 text-[10px]">Partners</span> : null}
      </div>
      {isExternal ? (
        <a
          href={resource.url}
          className="mt-auto inline-flex items-center text-sm font-semibold text-amber-300 hover:text-amber-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open →
        </a>
      ) : (
        <LocalizedLink href={resource.url}>
          <span className="mt-auto inline-flex items-center text-sm font-semibold text-amber-300 hover:text-amber-200">
            Open →
          </span>
        </LocalizedLink>
      )}
    </article>
  );
}

function mapMediaItem(entity: MediaItemEntity | null | undefined): MediaCardProps | null {
  const attributes = extractAttributes<MediaItemEntity["attributes"]>(entity);
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

  const thumbnailAttributes = extractSingleRelation<{ url?: string; alternativeText?: string }>(attributes.thumbnail);
  const thumbnail = thumbnailAttributes?.url
    ? {
        src: thumbnailAttributes.url,
        alt: thumbnailAttributes.alternativeText ?? title,
      }
    : undefined;

  const speakers = extractManyRelation<{ name?: string; displayName?: string }>(attributes.speakers)
    .map((speaker) => speaker.displayName?.trim() || speaker.name)
    .filter((name): name is string => Boolean(name && name.trim()));

  return {
    title,
    href: `/media/${slug}`,
    excerpt,
    category: extractSingleRelation<{ name?: string }>(attributes.category)?.name ?? attributes.legacyCategory ?? undefined,
    thumbnail,
    views: typeof attributes.views === "number" ? attributes.views : undefined,
    durationSec: typeof attributes.durationSec === "number" ? attributes.durationSec : undefined,
    speakers: speakers.length ? speakers : undefined,
  };
}

function normalizeCourses(items: unknown[]): Course[] {
  return items
    .map((item) => {
      const attributes = (item as { attributes?: Record<string, unknown> } | undefined)?.attributes;
      if (!attributes) return null;

      const title = attributes.name;
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

function mapLessonDownload(lesson: LessonEntity | null | undefined): LessonDownload | null {
  if (!lesson?.attributes) return null;
  const resourcesArray = Array.isArray(lesson.attributes.resources) ? lesson.attributes.resources : [];

  const lessonResources: LessonResourceLink[] = [];
  for (const resource of resourcesArray) {
    if (!resource || typeof resource.url !== "string") continue;
    const url = resource.url.trim();
    if (!url) continue;

    const rawLabel =
      typeof resource.label === "string"
        ? resource.label.trim()
        : typeof resource.label === "number"
        ? String(resource.label)
        : null;
    const label = rawLabel && rawLabel.length ? rawLabel : null;

    const normalized: LessonResourceLink = {
      id: typeof resource.id === "number" ? resource.id : undefined,
      url,
      requiresLogin: Boolean(resource.requiresLogin),
      type: resource.type ?? null,
    };
    if (label !== null) {
      normalized.label = label;
    }

    lessonResources.push(normalized);
  }

  return {
    id: lesson.id,
    title: lesson.attributes.title ?? "Discipleship resource",
    summary: lesson.attributes.summary ?? null,
    courseTitle: lesson.attributes.course?.data?.attributes?.name ?? null,
    categoryName: lesson.attributes.category?.data?.attributes?.name ?? null,
    resources: lessonResources,
  };
}

function mapArticleEntity(article: ArticleEntity | null | undefined): ArticleCard | null {
  if (!article?.attributes) return null;
  const slug = article.attributes.slug;
  if (typeof slug !== "string" || !slug.trim()) return null;
  return {
    id: `article-${article.id}`,
    title: article.attributes.title ?? "Article",
    href: `/articles/${slug}`,
    summary: article.attributes.description ?? null,
    image: {
      src: article.attributes.cover?.data?.attributes?.url ?? undefined,
      alt: article.attributes.cover?.data?.attributes?.alternativeText ?? article.attributes.title ?? null,
    },
    label: article.attributes.category?.data?.attributes?.name ?? null,
  };
}

function mapBlogPostEntity(post: BlogPostEntity | null | undefined): ArticleCard | null {
  if (!post?.attributes) return null;
  const slug = post.attributes.slug;
  if (typeof slug !== "string" || !slug.trim()) return null;

  return {
    id: `blog-${post.id}`,
    title: post.attributes.title ?? "Blog post",
    href: `/blog/${slug}`,
    summary: summarizeBlocks(post.attributes.content) ?? null,
    image: {
      src: post.attributes.featuredImage?.data?.attributes?.url ?? undefined,
      alt: post.attributes.featuredImage?.data?.attributes?.alternativeText ?? post.attributes.title ?? null,
    },
    label: post.attributes.team_member?.data?.attributes?.name ?? null,
  };
}

function summarizeBlocks(blocks: unknown): string | undefined {
  if (!Array.isArray(blocks)) return undefined;
  for (const block of blocks) {
    const text = extractText(block);
    if (text.trim()) {
      return text.trim();
    }
  }
  return undefined;
}

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (!node || typeof node !== "object") return "";
  const candidate = node as { text?: unknown; children?: unknown };
  if (typeof candidate.text === "string") return candidate.text;
  if (Array.isArray(candidate.children)) {
    return candidate.children.map((child) => extractText(child)).join("");
  }
  return "";
}

function stripHtml(value?: string | null) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function ensureAbsoluteUrl(url: string, baseUrl: string) {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return undefined;
  }
}
