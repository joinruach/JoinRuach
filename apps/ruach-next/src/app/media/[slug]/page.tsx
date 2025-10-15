import Link from "next/link";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import SEOHead from "@/components/ruach/SEOHead";
import MediaPlayer from "@/components/ruach/MediaPlayer";
import { getMediaBySlug, getMediaByCategory, imgUrl } from "@/lib/strapi";
import type { MediaItemEntity } from "@/lib/types/strapi-types";

export const dynamic = "force-static";

type Props = { params: Promise<{ slug: string }> };

type MediaAttributes = MediaItemEntity["attributes"];

function extractAttributes(entity: MediaItemEntity | (Partial<MediaAttributes> & Record<string, any>) | null | undefined) {
  if (!entity || typeof entity !== "object") return undefined;
  if ("attributes" in entity && entity.attributes) {
    return entity.attributes;
  }
  const { id: _id, documentId: _documentId, ...rest } = entity as Record<string, any>;
  return rest as Partial<MediaAttributes>;
}

function extractSingleRelation<T extends Record<string, any>>(value: any): (T & { id?: number }) | undefined {
  if (!value) return undefined;
  const data = (typeof value === "object" && value !== null && "data" in value) ? (value as any).data : value;
  if (!data || typeof data !== "object") return undefined;
  const attributes = extractAttributes(data as any) as T | undefined;
  if (!attributes) return undefined;
  return {
    id: (data as any).id,
    ...attributes,
  };
}

function extractManyRelation<T extends Record<string, any>>(value: any): Array<T & { id?: number }> {
  if (!value) return [];
  const raw = (typeof value === "object" && value !== null && "data" in value) ? (value as any).data : value;
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .map((item) => {
      if (!item || typeof item !== "object") return undefined;
      const attributes = extractAttributes(item as any) as T | undefined;
      if (!attributes) return undefined;
      return {
        id: (item as any).id,
        ...attributes,
      };
    })
    .filter(Boolean) as Array<T & { id?: number }>;
}

function extractMediaUrl(value: any) {
  const media = extractSingleRelation<{ url?: string }>(value);
  return media?.url;
}

export async function generateMetadata({ params }: Props){
  const { slug } = await params;
  const data = await getMediaBySlug(slug);
  const a = extractAttributes(data);
  const title = a?.seoTitle || a?.title || "Media";
  const desc = a?.seoDescription || a?.description || "";
  const thumb = imgUrl(extractMediaUrl(a?.seoImage) || extractMediaUrl(a?.thumbnail));
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: thumb ? [thumb] : []
    }
  };
}

export default async function MediaDetail({ params }: Props){
  const { slug } = await params;
  const data = await getMediaBySlug(slug);
  const a = extractAttributes(data);
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
      const attr = extractAttributes(item);
      if (!attr || attr.slug === slug) return null;
      const relCategory = extractSingleRelation<{ name?: string }>(attr.category)?.name ?? attr.legacyCategory ?? undefined;
      const speakerNames = extractManyRelation<{ name?: string }>(attr.speakers)
        .map((speaker) => speaker.name)
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

  const thumbUrl = imgUrl(extractMediaUrl(a.thumbnail));

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: a.title,
    description: a.description,
    thumbnailUrl: thumbUrl ? [thumbUrl] : undefined,
    uploadDate: a.publishedAt,
    contentUrl: isFileVideo ? videoUrl : undefined,
    embedUrl: !isFileVideo ? videoUrl : undefined
  };

  return (
    <div className="space-y-10">
      <SEOHead jsonLd={jsonLd} />
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-white/60">
          {categoryName ? <span>{categoryName}</span> : null}
          {a.publishedAt ? (
            <span className="text-white/40">{new Date(a.publishedAt).toLocaleDateString()}</span>
          ) : null}
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">{a.title}</h1>
        {a.description ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">{a.description}</p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-black">
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
            <h2 className="text-lg font-semibold text-white">Related Media</h2>
            <Link href="/media" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
              Browse all media →
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white p-8 text-neutral-900">
            <MediaGrid items={related} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
