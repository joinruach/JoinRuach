import Link from "next/link";
import { notFound } from "next/navigation";
import AudioPlayer from "@/components/ruach/AudioPlayer";
import MediaPlayer from "@/components/ruach/MediaPlayer";
import SEOHead from "@/components/ruach/SEOHead";
import { requireActiveMembership } from "@/lib/require-membership";
import { getMediaBySlug, getMediaByCategory, imgUrl } from "@/lib/strapi";
import { extractAttributes, extractMediaUrl, extractSingleRelation } from "@/lib/strapi-normalize";
import type { MediaItemEntity } from "@/lib/types/strapi-types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

const AUDIO_EXTENSIONS = new Set(["mp3", "m4a", "aac", "wav", "ogg", "flac"]);

function getExtension(url?: string) {
  if (!url) return undefined;
  try {
    const normalized = url.split("?")[0] ?? url;
    const segments = normalized.split(".");
    const ext = segments[segments.length - 1];
    return ext?.toLowerCase();
  } catch {
    return undefined;
  }
}

function resolvePlayback(attributes: MediaItemEntity["attributes"]) {
  const source = attributes.source;

  if (source?.kind === "file") {
    const rawUrl = extractMediaUrl(source.file);
    if (rawUrl) {
      const url = imgUrl(rawUrl);
      const extension = getExtension(rawUrl);
      if (url && extension && AUDIO_EXTENSIONS.has(extension)) {
        return { kind: "audio" as const, url };
      }
      if (url) {
        return { kind: "video" as const, url, isFile: true };
      }
    }
  }

  if (source?.url) {
    const url = source.url;
    const extension = getExtension(url);
    if (url && extension && AUDIO_EXTENSIONS.has(extension)) {
      return { kind: "audio" as const, url };
    }
    return { kind: "embed" as const, url };
  }

  const legacyUrl = attributes.video_url || attributes.videoUrl;
  if (legacyUrl) {
    const extension = getExtension(legacyUrl);
    if (extension && AUDIO_EXTENSIONS.has(extension)) {
      return { kind: "audio" as const, url: legacyUrl };
    }
    return { kind: "embed" as const, url: legacyUrl };
  }

  return { kind: "unknown" as const };
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await getMediaBySlug(slug);
  const attributes = extractAttributes<MediaItemEntity["attributes"]>(data as any);
  if (!attributes) {
    return {
      title: "Member Podcast",
      description: "Partner-exclusive podcast episode from Ruach Ministries.",
    };
  }

  const title = attributes.title ?? "Member Podcast";
  const description = attributes.excerpt ?? attributes.description ?? "Partner-exclusive podcast episode.";
  const image = extractMediaUrl(attributes.thumbnail) ?? extractMediaUrl(attributes.seoImage);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [imgUrl(image)] : undefined,
    },
  };
}

export default async function MemberPodcastDetail({ params }: Props) {
  const { slug } = await params;
  const path = `/members/podcasts/${slug}`;
  await requireActiveMembership(path);

  const entity = await getMediaBySlug(slug);
  const attributes = extractAttributes<MediaItemEntity["attributes"]>(entity as any);
  if (!attributes) {
    notFound();
  }

  const categorySlug = extractSingleRelation<{ slug?: string }>(attributes.category)?.slug;
  const related =
    categorySlug && attributes.slug
      ? (await getMediaByCategory(categorySlug, 5))
          .map((item) => {
            const attr = extractAttributes<MediaItemEntity["attributes"]>(item as any);
            if (!attr || attr.slug === attributes.slug) return null;
            return attr;
          })
          .filter((attr): attr is NonNullable<typeof attr> => Boolean(attr))
          .slice(0, 4)
      : [];

  const mediaId = (entity as MediaItemEntity | null)?.id ?? 0;
  const playback = resolvePlayback(attributes);
  const posterUrl = extractMediaUrl(attributes.thumbnail);
  const poster = posterUrl ? imgUrl(posterUrl) : undefined;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: attributes.title,
    description: attributes.description,
    uploadDate: attributes.releasedAt ?? attributes.publishedAt,
    thumbnailUrl: poster ? [poster] : undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ruachministries.org"}/members/podcasts/${slug}`,
  };

  return (
    <div className="space-y-10">
      <SEOHead jsonLd={jsonLd} />

      <header className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-white/60">
          <span>Partner Podcast</span>
          {attributes.releasedAt ? (
            <span className="text-white/40">
              {new Date(attributes.releasedAt).toLocaleDateString()}
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">{attributes.title}</h1>
        {attributes.description ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">{attributes.description}</p>
        ) : null}
      </header>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-black p-6 text-white">
        {playback.kind === "audio" && playback.url ? (
          <AudioPlayer mediaId={mediaId} src={playback.url} title={attributes.title ?? ""} />
        ) : playback.kind === "video" && playback.url ? (
          <MediaPlayer
            mediaId={mediaId}
            videoUrl={playback.url}
            isFileVideo={true}
            poster={poster}
            title={attributes.title ?? ""}
          />
        ) : playback.kind === "embed" && playback.url ? (
          <iframe
            src={playback.url}
            className="h-96 w-full"
            title={attributes.title ?? "Podcast player"}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 p-6 text-sm text-white/60">
            Playback will be available soon. Check back shortly.
          </div>
        )}
      </section>

      {Array.isArray(related) && related.length ? (
        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-white">More partner episodes</h2>
            <Link href="/members/podcasts" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
              Back to podcast hub →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {related.map((attrs) => {
              if (!attrs.slug) return null;
              return (
                <Link
                  key={attrs.slug}
                  href={`/members/podcasts/${attrs.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white transition hover:border-amber-300"
                >
                  <div className="text-xs uppercase tracking-wide text-white/50">
                    Released {attrs.releasedAt ? new Date(attrs.releasedAt).toLocaleDateString() : ""}
                  </div>
                  <div className="mt-2 text-base font-semibold">{attrs.title}</div>
                  {attrs.excerpt ? (
                    <p className="mt-2 text-sm text-white/70">{attrs.excerpt}</p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
