import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import { imgUrl } from "@/lib/strapi";
import type { OutreachStoryEntity } from "@/lib/types/strapi-types";

export type StoryMedia = {
  url: string;
  alternativeText: string;
  width?: number;
  height?: number;
};

function extractDimension(source: unknown, key: "width" | "height"): number | undefined {
  if (!source || typeof source !== "object") return undefined;
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}

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

export function getPrimaryStoryMedia(story: OutreachStoryEntity): StoryMedia | undefined {
  const mediaData = story?.attributes?.media?.data;
  if (!Array.isArray(mediaData) || mediaData.length === 0) {
    return undefined;
  }

  const attributes = mediaData[0]?.attributes;
  if (!attributes?.url) return undefined;
  const resolvedUrl = imgUrl(attributes.url);
  if (!resolvedUrl) return undefined;

  return {
    url: resolvedUrl,
    alternativeText: attributes.alternativeText ?? attributes.name ?? "Outreach story media",
    width: extractDimension(attributes, "width"),
    height: extractDimension(attributes, "height")
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
