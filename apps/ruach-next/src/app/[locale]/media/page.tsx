import { MediaBrowser } from "@/components/media/MediaBrowser";
import type { MediaCardProps } from "@/components/ruach/MediaCard";
import { getMediaCategories, getMediaItems } from "@/lib/strapi";
import {
  extractAttributes,
  extractManyRelation,
  extractSingleRelation,
} from "@/lib/strapi-normalize";
import type { MediaItemEntity } from "@/lib/types/strapi-types";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  // Fetch all media items and categories
  const [categories, { data }] = await Promise.all([
    getMediaCategories(),
    getMediaItems({
      pageSize: 100, // Get more items for client-side filtering
    }),
  ]);

  // Process categories for filter dropdown
  const seenCategorySlugs = new Set<string>();
  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...categories
      .map((c) => {
        const attrs = extractAttributes<{ name?: string; slug?: string }>(c);
        const slug = attrs?.slug;
        const name = attrs?.name;
        if (!slug || !name) return null;
        return { value: slug, label: name };
      })
      .filter((option): option is { value: string; label: string } => {
        if (!option) return false;
        if (seenCategorySlugs.has(option.value)) return false;
        seenCategorySlugs.add(option.value);
        return true;
      }),
  ];

  // Process media items
  const items: MediaCardProps[] = [];
  const entities = Array.isArray(data) ? data : [];
  type MediaAttributes = MediaItemEntity["attributes"];

  // Track all unique speakers for filter
  const speakersMap = new Map<string, string>();

  for (const entity of entities) {
    const attributes = extractAttributes<MediaAttributes>(entity);
    if (!attributes) continue;

    const slugValue = attributes.slug;
    const slug = typeof slugValue === "string" && slugValue.trim().length ? slugValue : undefined;
    if (!slug) continue;

    const rawTitle = attributes.title;
    const title = typeof rawTitle === "string" && rawTitle.trim().length ? rawTitle : "Untitled Media";

    const categoryEntity = extractSingleRelation<{ name?: string; slug?: string }>(attributes.category);
    const speakerEntities = extractManyRelation<{ name?: string; displayName?: string }>(attributes.speakers);
    const speakerNames = speakerEntities
      .map((speaker) => {
        const displayName = speaker.displayName?.trim() || speaker.name;
        if (displayName) {
          speakersMap.set(displayName, displayName);
        }
        return displayName;
      })
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

    // Only include videoSource if it has a valid kind
    const videoSource = attributes.source?.kind ? attributes.source : undefined;

    items.push({
      title,
      href: `/media/${slug}`,
      excerpt,
      category: categoryEntity?.name ?? attributes.legacyCategory ?? undefined,
      thumbnail,
      views: attributes.views ?? 0,
      durationSec: attributes.durationSec ?? undefined,
      speakers: speakerNames,
      mediaId: entity?.id,
      videoSource: videoSource as any,
      likes: attributes.likes ?? 0,
    });
  }

  // Convert speakers map to options array
  const speakerOptions = Array.from(speakersMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-foreground">Media Library</h1>
        <p className="text-sm text-muted-foreground">
          Watch testimonies of freedom, deep-dive discipleship sessions, and cinematic encounters from Ruach Studios.
        </p>
      </header>

      {/* Media Browser */}
      <MediaBrowser
        initialItems={items}
        categories={categoryOptions}
        speakers={speakerOptions}
      />
    </div>
  );
}
