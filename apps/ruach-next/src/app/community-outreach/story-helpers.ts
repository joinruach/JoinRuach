import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import { imgUrl } from "@/lib/strapi";
import type { OutreachStoryEntity } from "@/lib/types/strapi-types";

export function formatStoryDate(input?: string | null) {
  if (!input) return undefined;
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(input));
  } catch {
    return undefined;
  }
}

export function getPrimaryStoryMedia(story: OutreachStoryEntity) {
  const mediaData = story?.attributes?.media?.data;
  if (!Array.isArray(mediaData) || mediaData.length === 0) {
    return undefined;
  }

  const attributes = mediaData[0]?.attributes;
  if (!attributes?.url) return undefined;

  return {
    url: imgUrl(attributes.url),
    alternativeText: attributes.alternativeText ?? attributes.name ?? "Outreach story media"
  };
}

export function mapStoryToMediaCard(story: OutreachStoryEntity): MediaCardProps | null {
  const attributes = story?.attributes;
  if (!attributes?.slug || !attributes?.title) return null;

  const relatedCampaignName = attributes.relatedCampaign?.data?.attributes?.name;
  const tagName =
    attributes.tags?.data && attributes.tags.data.length > 0
      ? attributes.tags.data[0]?.attributes?.name
      : undefined;

  const category = relatedCampaignName ?? tagName ?? formatStoryDate(attributes.storyDate);
  const media = getPrimaryStoryMedia(story);

  return {
    title: attributes.title,
    href: `/community-outreach/stories/${attributes.slug}`,
    excerpt: attributes.summary ?? undefined,
    category,
    thumbnail: media
      ? {
          src: media.url,
          alt: media.alternativeText
        }
      : undefined
  };
}
