import { notFound } from "next/navigation";
import Image from "next/image";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import MediaGrid from "@/components/media/MediaGrid";
import type { MediaCardProps } from "@/components/ruach/MediaCard";
import { getCollectionBySlug, imgUrl } from "@/lib/strapi";
import {
  extractAttributes,
  extractManyRelation,
  extractMediaUrl,
  extractSingleRelation,
} from "@/lib/strapi-normalize";
import type { MediaItemEntity, SeriesEntity } from "@/lib/types/strapi-types";
import { getAbsoluteUrl } from "@/lib/share";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

const kindLabels: Record<string, string> = {
  series: "Series",
  course: "Course",
  conference: "Conference",
  playlist: "Playlist",
};

type EpisodeCandidate = {
  slug: string;
  seasonNumber?: number;
  episodeNumber?: number;
  releasedAt?: string | null;
};

function normalizeText(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function parseDate(value?: string | null) {
  if (!value) return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : time;
}

function pickPlayEpisode(episodes: MediaItemEntity[]) {
  const candidates: EpisodeCandidate[] = [];

  for (const entity of episodes) {
    const attrs = extractAttributes<MediaItemEntity["attributes"]>(entity);
    if (!attrs) continue;
    const slug = typeof attrs.slug === "string" ? attrs.slug.trim() : "";
    if (!slug) continue;

    candidates.push({
      slug,
      seasonNumber: typeof attrs.seasonNumber === "number" ? attrs.seasonNumber : undefined,
      episodeNumber: typeof attrs.episodeNumber === "number" ? attrs.episodeNumber : undefined,
      releasedAt: attrs.releasedAt ?? null,
    });
  }

  if (!candidates.length) {
    return undefined;
  }

  const hasOrdering = candidates.some(
    (candidate) => typeof candidate.seasonNumber === "number" || typeof candidate.episodeNumber === "number"
  );

  if (hasOrdering) {
    const ordered = [...candidates].sort((a, b) => {
      const seasonA = typeof a.seasonNumber === "number" ? a.seasonNumber : Number.POSITIVE_INFINITY;
      const seasonB = typeof b.seasonNumber === "number" ? b.seasonNumber : Number.POSITIVE_INFINITY;
      if (seasonA !== seasonB) return seasonA - seasonB;

      const episodeA = typeof a.episodeNumber === "number" ? a.episodeNumber : Number.POSITIVE_INFINITY;
      const episodeB = typeof b.episodeNumber === "number" ? b.episodeNumber : Number.POSITIVE_INFINITY;
      if (episodeA !== episodeB) return episodeA - episodeB;

      const releasedA = parseDate(a.releasedAt) ?? Number.POSITIVE_INFINITY;
      const releasedB = parseDate(b.releasedAt) ?? Number.POSITIVE_INFINITY;
      return releasedA - releasedB;
    });

    return ordered[0];
  }

  const byRelease = [...candidates].sort((a, b) => {
    const releasedA = parseDate(a.releasedAt) ?? Number.POSITIVE_INFINITY;
    const releasedB = parseDate(b.releasedAt) ?? Number.POSITIVE_INFINITY;
    return releasedA - releasedB;
  });

  return byRelease[0];
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { collection } = await getCollectionBySlug(slug);

  if (!collection) {
    return { title: "Collection Not Found" };
  }

  const attrs = extractAttributes<SeriesEntity["attributes"]>(collection);
  const title = attrs?.title ?? "Collection";
  const description =
    normalizeText(typeof attrs?.summary === "string" ? attrs.summary : undefined) ??
    normalizeText(typeof attrs?.description === "string" ? attrs.description : undefined) ??
    "Explore this collection from Ruach Ministries.";

  const poster = extractSingleRelation<{ url?: string }>(attrs?.poster);
  const cover = extractSingleRelation<{ url?: string }>(attrs?.coverImage);
  const hero = extractSingleRelation<{ url?: string }>(attrs?.heroBackdrop);
  const image = imgUrl(hero?.url ?? cover?.url ?? poster?.url ?? "") || undefined;

  return {
    title: `${title} | Ruach Ministries`,
    description,
    openGraph: {
      title,
      description,
      url: getAbsoluteUrl(`/media/c/${slug}`),
      images: image ? [image] : [],
    },
  };
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  const { collection, episodes } = await getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const attrs = extractAttributes<SeriesEntity["attributes"]>(collection);
  const title = attrs?.title ?? "Untitled Collection";
  const summary =
    normalizeText(typeof attrs?.summary === "string" ? attrs.summary : undefined) ??
    normalizeText(typeof attrs?.description === "string" ? attrs.description : undefined);
  const kindLabel = kindLabels[attrs?.kind ?? "series"] ?? "Collection";

  const poster = extractSingleRelation<{ url?: string; alternativeText?: string }>(attrs?.poster);
  const cover = extractSingleRelation<{ url?: string; alternativeText?: string }>(attrs?.coverImage);
  const hero = extractSingleRelation<{ url?: string; alternativeText?: string }>(attrs?.heroBackdrop);
  const imageUrl = hero?.url ?? cover?.url ?? poster?.url;
  const imageAlt = hero?.alternativeText ?? cover?.alternativeText ?? poster?.alternativeText ?? title;

  const episodeCards: MediaCardProps[] = [];
  for (const entity of episodes) {
    const episodeAttrs = extractAttributes<MediaItemEntity["attributes"]>(entity);
    if (!episodeAttrs) continue;

    const episodeSlug = typeof episodeAttrs.slug === "string" ? episodeAttrs.slug.trim() : "";
    if (!episodeSlug) continue;

    const episodeTitle = normalizeText(episodeAttrs.title) ?? "Untitled Episode";
    const excerpt =
      normalizeText(episodeAttrs.excerpt) ??
      normalizeText(typeof episodeAttrs.description === "string" ? episodeAttrs.description : undefined);

    const thumbnailUrl =
      extractMediaUrl(episodeAttrs.thumbnail) ??
      extractSingleRelation<{ url?: string }>(episodeAttrs.thumbnail)?.url;

    episodeCards.push({
      title: episodeTitle,
      href: `/media/v/${episodeSlug}`,
      excerpt,
      thumbnail: thumbnailUrl ? { src: thumbnailUrl } : undefined,
      durationSec: episodeAttrs.durationSec ?? undefined,
      speakers: extractManyRelation<{ name?: string; displayName?: string }>(episodeAttrs.speakers)
        .map((speaker) => speaker.displayName?.trim() || speaker.name)
        .filter((name): name is string => Boolean(name && name.trim())),
    });
  }

  const playEpisode = pickPlayEpisode(episodes);
  const firstEpisodeSlug = playEpisode ? `/media/v/${playEpisode.slug}` : undefined;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
          <div className="space-y-6">
            <LocalizedLink href="/media">
              <span className="inline-flex items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-white/70 dark:hover:text-white">
                ← Back to Media Library
              </span>
            </LocalizedLink>

            <div className="space-y-3">
              <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">{kindLabel}</div>
              <h1 className="text-4xl font-semibold text-zinc-900 dark:text-white">{title}</h1>
              {summary ? (
                <p className="text-base text-zinc-600 dark:text-white/70">{summary}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-white/60">
              <span>{episodeCards.length} {episodeCards.length === 1 ? "episode" : "episodes"}</span>
              {attrs?.sortMode === "newest_first" ? <span>Newest first</span> : <span>Episode order</span>}
            </div>

            {firstEpisodeSlug ? (
              <LocalizedLink
                href={firstEpisodeSlug}
                className="inline-flex items-center justify-center rounded-full bg-amber-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
              >
                Play first episode
              </LocalizedLink>
            ) : null}
          </div>

          {imageUrl ? (
            <div className="relative aspect-video overflow-hidden rounded-2xl">
              <Image
                src={imgUrl(imageUrl) ?? ""}
                alt={imageAlt}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10">
              <span className="text-5xl text-zinc-300 dark:text-white/20">🎞️</span>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Episodes</h2>
          <span className="text-sm text-zinc-500 dark:text-white/60">
            {episodeCards.length} total
          </span>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-neutral-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
          {episodeCards.length ? (
            <MediaGrid items={episodeCards} />
          ) : (
            <div className="py-12 text-center text-sm text-zinc-600 dark:text-white/70">
              No episodes available in this collection yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
