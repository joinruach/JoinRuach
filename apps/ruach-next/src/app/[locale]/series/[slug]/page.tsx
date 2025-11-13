import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import { getSeriesBySlug, imgUrl } from "@/lib/strapi";
import {
  extractAttributes,
  extractManyRelation,
  extractSingleRelation,
} from "@/lib/strapi-normalize";
import type { MediaItemEntity, SeriesEntity } from "@/lib/types/strapi-types";

export const dynamic = "force-static";

type Props = {
  params: Promise<{ slug: string }>;
};

type MediaCardItem = MediaCardProps & {
  views: number;
  durationSec?: number | null;
  speakers: string[];
  weekNumber?: number;
  episodeNumber?: number;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    return {
      title: "Series Not Found",
    };
  }

  const attrs = extractAttributes<SeriesEntity["attributes"]>(series);
  const title = `${attrs?.title ?? "Series"} | Ruach Ministries`;
  const description = typeof attrs?.description === "string"
    ? attrs.description.slice(0, 160)
    : "A curated series of teachings and testimonies from Ruach Ministries.";

  const coverAttributes = extractSingleRelation<{ url?: string }>(attrs?.coverImage);
  const image = coverAttributes?.url ? imgUrl(coverAttributes.url) : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function SeriesDetailPage({ params }: Props) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  const attrs = extractAttributes<SeriesEntity["attributes"]>(series);
  const title = attrs?.title ?? "Untitled Series";
  const description = attrs?.description ?? null;

  const coverAttributes = extractSingleRelation<{ url?: string; alternativeText?: string }>(attrs?.coverImage);
  const coverImage = coverAttributes?.url ? imgUrl(coverAttributes.url) : undefined;
  const coverAlt = coverAttributes?.alternativeText ?? title;

  // Process media items
  const mediaItems = attrs?.mediaItems?.data ?? [];
  const items: MediaCardItem[] = [];

  for (const entity of mediaItems) {
    const mediaAttrs = extractAttributes<MediaItemEntity["attributes"]>(entity);
    if (!mediaAttrs) continue;

    const slugValue = mediaAttrs.slug;
    const itemSlug = typeof slugValue === "string" && slugValue.trim().length ? slugValue : undefined;
    if (!itemSlug) continue;

    const rawTitle = mediaAttrs.title;
    const itemTitle = typeof rawTitle === "string" && rawTitle.trim().length ? rawTitle : "Untitled Media";

    const categoryEntity = extractSingleRelation<{ name?: string; slug?: string }>(mediaAttrs.category);
    const speakerNames = extractManyRelation<{ name?: string; displayName?: string }>(mediaAttrs.speakers)
      .map((speaker) => speaker.displayName?.trim() || speaker.name)
      .filter((name): name is string => Boolean(name && name.trim()));

    const thumbnailAttributes = extractSingleRelation<{ url?: string; alternativeText?: string }>(mediaAttrs.thumbnail);
    const thumbnail = thumbnailAttributes?.url
      ? { src: imgUrl(thumbnailAttributes.url) ?? "", alt: thumbnailAttributes.alternativeText ?? itemTitle }
      : undefined;

    const excerpt =
      typeof mediaAttrs.excerpt === "string" && mediaAttrs.excerpt.trim().length
        ? mediaAttrs.excerpt
        : typeof mediaAttrs.description === "string"
          ? mediaAttrs.description
          : undefined;

    items.push({
      title: itemTitle,
      href: `/media/${itemSlug}`,
      excerpt,
      category: categoryEntity?.name ?? mediaAttrs.legacyCategory ?? undefined,
      thumbnail,
      views: mediaAttrs.views ?? 0,
      durationSec: mediaAttrs.durationSec ?? undefined,
      speakers: speakerNames,
      weekNumber: mediaAttrs.weekNumber ?? undefined,
      episodeNumber: mediaAttrs.episodeNumber ?? undefined,
    });
  }

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-8 p-8 lg:p-12">
          <div className="space-y-6">
            <div>
              <Link
                href="/series"
                className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
              >
                ← Back to Series
              </Link>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                {title}
              </h1>
              {description && (
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg text-white/80 leading-relaxed">
                    {description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-white/70">
              <span>{items.length} {items.length === 1 ? 'episode' : 'episodes'}</span>
            </div>
          </div>

          {coverImage && (
            <div className="relative aspect-video lg:aspect-square rounded-xl overflow-hidden">
              <Image
                src={coverImage}
                alt={coverAlt}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
      </section>

      {/* Episodes Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Episodes</h2>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white p-8 text-neutral-900">
          {items.length > 0 ? (
            <MediaGrid items={items} />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-neutral-600">No episodes available in this series yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
