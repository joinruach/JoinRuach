import Image from "next/image";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import MediaGrid from "@/components/media/MediaGrid";
import type { MediaCardProps } from "@/components/ruach/MediaCard";
import { getMediaLibrary, imgUrl } from "@/lib/strapi";
import { extractAttributes, extractManyRelation, extractSingleRelation } from "@/lib/strapi-normalize";
import type { MediaItemEntity, SeriesEntity } from "@/lib/types/strapi-types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

type CollectionAttributes = SeriesEntity["attributes"] & {
  episodeCount?: number;
  latestEpisode?: {
    title?: string;
    publishedAt?: string;
    releasedAt?: string;
    thumbnail?: unknown;
  };
};

type CollectionCard = {
  slug: string;
  title: string;
  summary?: string;
  kindLabel: string;
  episodeCount: number;
  latestLabel?: string;
  image?: { src: string; alt: string };
  featured: boolean;
};

const kindLabels: Record<string, string> = {
  series: "Series",
  course: "Course",
  conference: "Conference",
  playlist: "Playlist",
};

function formatDate(value?: string | null) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeSummary(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export default async function MediaPage({ params }: Props) {
  await params;

  const library = await getMediaLibrary();
  const collections = Array.isArray(library.collections) ? library.collections : [];
  const standalone = Array.isArray(library.standalone) ? library.standalone : [];

  const collectionCards: CollectionCard[] = collections.flatMap((collection) => {
      const attrs = extractAttributes<CollectionAttributes>(collection);
      if (!attrs) return [];

      const slug = typeof attrs.slug === "string" && attrs.slug.trim().length ? attrs.slug : undefined;
      if (!slug) return [];

      const title = typeof attrs.title === "string" && attrs.title.trim().length ? attrs.title : "Untitled Collection";
      const summary =
        normalizeSummary(attrs.summary) ??
        normalizeSummary(typeof attrs.description === "string" ? attrs.description : undefined);
      const kindLabel = kindLabels[attrs.kind ?? "series"] ?? "Collection";
      const episodeCount = typeof attrs.episodeCount === "number" ? attrs.episodeCount : 0;
      const latestPublishedAt =
        typeof attrs.latestEpisode?.publishedAt === "string" ? attrs.latestEpisode.publishedAt : undefined;
      const latestReleasedAt =
        typeof attrs.latestEpisode?.releasedAt === "string" ? attrs.latestEpisode.releasedAt : undefined;
      const collectionPublishedAt = typeof attrs.publishedAt === "string" ? attrs.publishedAt : undefined;
      const latestDate = formatDate(latestPublishedAt ?? latestReleasedAt ?? collectionPublishedAt);

      const poster = extractSingleRelation<{ url?: string; alternativeText?: string }>(attrs.poster);
      const cover = extractSingleRelation<{ url?: string; alternativeText?: string }>(attrs.coverImage);
      const hero = extractSingleRelation<{ url?: string; alternativeText?: string }>(attrs.heroBackdrop);
      const imageUrl = poster?.url ?? cover?.url ?? hero?.url;
      const imageAlt = poster?.alternativeText ?? cover?.alternativeText ?? hero?.alternativeText ?? title;

      return [{
        slug,
        title,
        summary,
        kindLabel,
        episodeCount,
        latestLabel: latestDate ? `Latest episode · ${latestDate}` : undefined,
        image: imageUrl ? { src: imgUrl(imageUrl) ?? "", alt: imageAlt } : undefined,
        featured: Boolean(attrs.featured),
      }];
    });

  const featuredCollections = collectionCards.filter((card) => card.featured);
  const standardCollections = collectionCards.filter((card) => !card.featured);

  const mediaItems: MediaCardProps[] = [];
  type MediaAttributes = MediaItemEntity["attributes"];

  for (const entity of standalone) {
    const attributes = extractAttributes<MediaAttributes>(entity);
    if (!attributes) continue;

    const slugValue = attributes.slug;
    const slug = typeof slugValue === "string" && slugValue.trim().length ? slugValue : undefined;
    if (!slug) continue;

    const rawTitle = attributes.title;
    const title = typeof rawTitle === "string" && rawTitle.trim().length ? rawTitle : "Untitled Media";

    const categoryEntity = extractSingleRelation<{ name?: string; slug?: string }>(attributes.category);
    const speakerNames = extractManyRelation<{ name?: string; displayName?: string }>(attributes.speakers)
      .map((speaker) => speaker.displayName?.trim() || speaker.name)
      .filter((name): name is string => Boolean(name && name.trim()));

    const thumbnailAttributes = extractSingleRelation<{ url?: string; alternativeText?: string }>(attributes.thumbnail);
    const thumbnail = thumbnailAttributes?.url
      ? { src: thumbnailAttributes.url, alt: thumbnailAttributes.alternativeText ?? title }
      : undefined;

    const excerpt =
      typeof attributes.excerpt === "string" && attributes.excerpt.trim().length
        ? attributes.excerpt
        : typeof attributes.description === "string"
          ? attributes.description
          : undefined;

    const videoSource = attributes.source?.kind ? attributes.source : undefined;

    mediaItems.push({
      title,
      href: `/media/v/${slug}`,
      excerpt,
      category: categoryEntity?.name ?? attributes.legacyCategory ?? undefined,
      thumbnail,
      views: attributes.views ?? 0,
      durationSec: attributes.durationSec ?? undefined,
      speakers: speakerNames,
      mediaId: entity?.id,
      videoSource: videoSource as any,
    });
  }

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">Media Library</span>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Collections & Standalone</h1>
        <p className="text-sm text-zinc-600 dark:text-white/70">
          Explore curated collections alongside standalone teachings, testimonies, and films.
        </p>
      </header>

      {featuredCollections.length ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Featured Collections</h2>
            <p className="text-xs text-zinc-500 dark:text-white/60">
              {featuredCollections.length} highlighted this season
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCollections.map((collection) => (
              <LocalizedLink key={collection.slug} href={`/media/c/${collection.slug}`}>
                <div className="group rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 transition hover:border-zinc-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/10">
                  {collection.image?.src ? (
                    <div className="relative mb-4 aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={collection.image.src}
                        alt={collection.image.alt}
                        fill
                        className="object-cover transition group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-white dark:bg-white/10">
                      <span className="text-5xl text-zinc-300 dark:text-white/20">🎬</span>
                    </div>
                  )}

                  <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">
                    {collection.kindLabel}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white group-hover:text-amber-300">
                    {collection.title}
                  </h3>
                  {collection.summary ? (
                    <p className="mb-3 text-sm leading-relaxed text-zinc-600 dark:text-white/70 line-clamp-2">
                      {collection.summary}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-white/50">
                    <span>
                      {collection.episodeCount} {collection.episodeCount === 1 ? "episode" : "episodes"}
                    </span>
                    {collection.latestLabel ? <span>{collection.latestLabel}</span> : null}
                  </div>
                </div>
              </LocalizedLink>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Collections</h2>
          <p className="text-xs text-zinc-500 dark:text-white/60">{collectionCards.length} collections available</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {standardCollections.length ? (
            standardCollections.map((collection) => (
              <LocalizedLink key={collection.slug} href={`/media/c/${collection.slug}`}>
                <div className="group rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 transition hover:border-zinc-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/10">
                  {collection.image?.src ? (
                    <div className="relative mb-4 aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={collection.image.src}
                        alt={collection.image.alt}
                        fill
                        className="object-cover transition group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-white dark:bg-white/10">
                      <span className="text-5xl text-zinc-300 dark:text-white/20">📚</span>
                    </div>
                  )}

                  <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">
                    {collection.kindLabel}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white group-hover:text-amber-300">
                    {collection.title}
                  </h3>
                  {collection.summary ? (
                    <p className="mb-3 text-sm leading-relaxed text-zinc-600 dark:text-white/70 line-clamp-2">
                      {collection.summary}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-white/50">
                    <span>
                      {collection.episodeCount} {collection.episodeCount === 1 ? "episode" : "episodes"}
                    </span>
                    {collection.latestLabel ? <span>{collection.latestLabel}</span> : null}
                  </div>
                </div>
              </LocalizedLink>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-12 text-center">
              <p className="text-sm text-zinc-500 dark:text-white/60">
                No collections available yet. Check back soon for curated content collections.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Standalone Videos</h2>
          <p className="text-xs text-zinc-500 dark:text-white/60">{mediaItems.length} videos available</p>
        </div>
        <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white p-8 text-neutral-900">
          {mediaItems.length ? (
            <MediaGrid items={mediaItems} />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-neutral-600">No standalone videos available yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
