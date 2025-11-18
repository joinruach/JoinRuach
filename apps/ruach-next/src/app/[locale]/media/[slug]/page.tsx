import Link from "next-intl/link";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import SEOHead from "@/components/ruach/SEOHead";
import MediaPlayer from "@/components/ruach/MediaPlayer";
import ShareButton from "@/components/social/ShareButton";
import LikeButton from "@/components/social/LikeButton";
import { ScriptureList, ScriptureHighlight } from "@/components/scripture";
import { getMediaBySlug, getMediaByCategory, imgUrl } from "@/lib/strapi";
import {
  extractAttributes,
  extractManyRelation,
  extractMediaUrl,
  extractSingleRelation,
} from "@/lib/strapi-normalize";
import type { MediaItemEntity } from "@/lib/types/strapi-types";
import { getAbsoluteUrl, generateShareText, getDefaultHashtags, trackShare } from "@/lib/share";
import { trackLike } from "@/lib/likes";

export const dynamic = "force-static";

type Props = { params: Promise<{ slug: string }> };
type MediaAttributes = MediaItemEntity["attributes"];

function parseYouTubeTimestamp(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const isoMatch = trimmed.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (isoMatch) {
    const [, hIso, mIso, sIso] = isoMatch;
    const hours = hIso ? Number(hIso) : 0;
    const minutes = mIso ? Number(mIso) : 0;
    const seconds = sIso ? Number(sIso) : 0;
    const totalIso = hours * 3600 + minutes * 60 + seconds;
    return Number.isNaN(totalIso) ? undefined : totalIso;
  }

  const hMatch = trimmed.match(/(\d+)\s*h/i);
  const mMatch = trimmed.match(/(\d+)\s*m/i);
  const sMatch = trimmed.match(/(\d+)\s*s/i);
  if (hMatch || mMatch || sMatch) {
    const hours = hMatch ? Number(hMatch[1]) : 0;
    const minutes = mMatch ? Number(mMatch[1]) : 0;
    const seconds = sMatch ? Number(sMatch[1]) : 0;
    const totalHms = hours * 3600 + minutes * 60 + seconds;
    return Number.isNaN(totalHms) ? undefined : totalHms;
  }

  return undefined;
}

function normalizeVideoUrl(url: string | undefined): string | undefined {
  if (!url) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const hostname = parsed.hostname.toLowerCase();
  const normalizedHost = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  const pathSegments = parsed.pathname.split("/").filter(Boolean);

  const isYouTubeHost =
    normalizedHost === "youtu.be" ||
    normalizedHost === "youtube.com" ||
    normalizedHost === "m.youtube.com" ||
    normalizedHost === "music.youtube.com" ||
    normalizedHost === "youtube-nocookie.com";

  if (!isYouTubeHost) {
    return url;
  }

  let videoId: string | undefined;
  if (normalizedHost === "youtu.be") {
    videoId = pathSegments[0];
  } else if (parsed.pathname.startsWith("/watch")) {
    videoId = parsed.searchParams.get("v") ?? undefined;
  } else if (parsed.pathname.startsWith("/shorts/")) {
    videoId = pathSegments[1] ?? pathSegments[0];
  } else if (parsed.pathname.startsWith("/live/")) {
    videoId = pathSegments[1] ?? pathSegments[0];
  } else if (parsed.pathname.startsWith("/embed/")) {
    videoId = pathSegments[1] ?? pathSegments[0];
  }

  if (!videoId) {
    return url;
  }

  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);

  const list = parsed.searchParams.get("list");
  if (list) {
    embedUrl.searchParams.set("list", list);
  }

  const start =
    parseYouTubeTimestamp(parsed.searchParams.get("start")) ??
    parseYouTubeTimestamp(parsed.searchParams.get("t")) ??
    parseYouTubeTimestamp(parsed.hash.startsWith("#t=") ? parsed.hash.slice(3) : undefined);

  if (typeof start === "number" && start > 0) {
    embedUrl.searchParams.set("start", String(start));
  }

  const end = parseYouTubeTimestamp(parsed.searchParams.get("end"));
  if (typeof end === "number" && end > 0) {
    embedUrl.searchParams.set("end", String(end));
  }

  if (parsed.searchParams.get("loop") === "1") {
    embedUrl.searchParams.set("loop", "1");
  }

  const autoplay = parsed.searchParams.get("autoplay");
  if (autoplay === "1") {
    embedUrl.searchParams.set("autoplay", "1");
  }

  return embedUrl.toString();
}

export async function generateMetadata({ params }: Props){
  const { slug } = await params;
  const data = await getMediaBySlug(slug);
  const a = extractAttributes<MediaAttributes>(data);
  const title = a?.seoTitle || a?.title || "Media";
  const desc = a?.seoDescription || a?.description || "";
  const thumb = imgUrl(extractMediaUrl(a?.seoImage) || extractMediaUrl(a?.thumbnail));
  const url = getAbsoluteUrl(`/media/${slug}`);

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url,
      siteName: "Ruach Ministries",
      images: thumb ? [{
        url: thumb,
        width: 1200,
        height: 630,
        alt: title,
      }] : [],
      type: "video.other",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: thumb ? [thumb] : [],
    },
  };
}

export default async function MediaDetail({ params }: Props){
  const { slug } = await params;
  const data = await getMediaBySlug(slug);
  const a = extractAttributes<MediaAttributes>(data);
  if (!data || !a) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80">
        Media not found.
      </div>
    );
  }
  const categoryEntity = extractSingleRelation<{ name?: string; slug?: string }>(a.category);
  const categorySlug = categoryEntity?.slug;
  const categoryName = categoryEntity?.name ?? a.legacyCategory ?? undefined;
  const relatedRaw = categorySlug ? await getMediaByCategory(categorySlug, 4) : [];
  const related = (relatedRaw || [])
    .map((item: MediaItemEntity | (Partial<MediaAttributes> & Record<string, any>) | null | undefined) => {
      const attr = extractAttributes<MediaAttributes>(item);
      if (!attr || attr.slug === slug) return null;
      const relCategory = extractSingleRelation<{ name?: string }>(attr.category)?.name ?? attr.legacyCategory ?? undefined;
    const speakerNames = extractManyRelation<{ name?: string; displayName?: string }>(attr.speakers)
      .map((speaker) => speaker.displayName || speaker.name)
      .filter(Boolean) as string[];

      return {
        title: attr.title ?? "Untitled Media",
        href: `/media/${attr.slug}`,
        excerpt: attr.excerpt ?? attr.description,
        category: relCategory,
        thumbnail: (() => {
          const url = extractMediaUrl(attr.thumbnail);
          return url ? { src: url } : undefined;
        })(),
        views: attr.views ?? 0,
        durationSec: attr.durationSec ?? undefined,
        speakers: speakerNames,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const source = a.source;
  let videoUrl: string | undefined;
  let isFileVideo = false;

  const sourceFileUrl = source?.file ? extractMediaUrl(source.file) : undefined;

  if (source?.kind === "file" && sourceFileUrl) {
    videoUrl = imgUrl(sourceFileUrl);
    isFileVideo = true;
  } else if (source?.url) {
    videoUrl = source.url;
  } else if (a.video_url || a.videoUrl) {
    const legacyUrl = a.video_url || a.videoUrl;
    const looksLikeFile = legacyUrl ? /(\.mp4|\.mov|\.webm)$/i.test(legacyUrl) : false;
    videoUrl = looksLikeFile ? imgUrl(legacyUrl) : legacyUrl;
    isFileVideo = looksLikeFile;
  }

  if (videoUrl && !isFileVideo) {
    videoUrl = normalizeVideoUrl(videoUrl);
  }

  const thumbUrl = imgUrl(extractMediaUrl(a.thumbnail));
  const pageUrl = getAbsoluteUrl(`/media/${slug}`);
  const shareText = generateShareText("media", a.title ?? "Untitled Media");
  const shareHashtags = getDefaultHashtags("media");

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: a.title,
    description: a.description,
    thumbnailUrl: thumbUrl ? [thumbUrl] : undefined,
    uploadDate: data.publishedAt,
    contentUrl: isFileVideo ? videoUrl : undefined,
    embedUrl: !isFileVideo ? videoUrl : undefined
  };

  return (
    <div className="space-y-10">
      <SEOHead jsonLd={jsonLd} />
      <section className="rounded-3xl border border-neutral-200 bg-white p-8 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-neutral-600 dark:text-white/60">
            {categoryName ? <span>{categoryName}</span> : null}
            {data.publishedAt ? (
              <span className="text-neutral-400 dark:text-white/40">{new Date(data.publishedAt).toLocaleDateString()}</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <LikeButton
              contentType="media"
              contentId={data.id}
              initialLikes={a.likes ?? 0}
              onLike={(liked, count) => trackLike("media", data.id, liked)}
            />
            <ShareButton
              url={pageUrl}
              title={a.title ?? "Untitled Media"}
              description={shareText}
              hashtags={shareHashtags}
              onShare={(platform) => trackShare(platform, "media", data.id)}
            />
          </div>
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-white">{a.title}</h1>
        {a.description ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-700 dark:text-white/70">{a.description}</p>
        ) : null}

        {/* Featured Scripture */}
        {a.featuredScripture && (
          <div className="mt-6">
            <ScriptureHighlight reference={a.featuredScripture} variant="card" />
          </div>
        )}

        {/* Scripture References */}
        {a.scriptureReferences && a.scriptureReferences.length > 0 && (
          <div className="mt-6">
            <ScriptureList
              title="Key Scriptures"
              references={a.scriptureReferences}
              variant="badge"
            />
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-black">
        <MediaPlayer
          mediaId={data.id}
          videoUrl={videoUrl}
          isFileVideo={Boolean(isFileVideo)}
          poster={thumbUrl}
          title={a.title}
        />
      </section>

      {related.length ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Related Media</h2>
            <Link href="/media">
              <span className="text-sm font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-300 dark:hover:text-amber-200">Browse all media →</span>
            </Link>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-neutral-900 dark:border-white/10 dark:bg-white dark:text-neutral-900">
            <MediaGrid items={related} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
