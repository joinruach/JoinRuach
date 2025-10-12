import Link from "next/link";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import SEOHead from "@/components/ruach/SEOHead";
import MediaPlayer from "@/components/ruach/MediaPlayer";
import { getMediaBySlug, getMediaByCategory, imgUrl } from "@/lib/strapi";
import type { MediaItemEntity } from "@/lib/types/strapi-types";

export const dynamic = "force-static";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props){
  const { slug } = await params;
  const data = await getMediaBySlug(slug);
  const a: any = data?.attributes || {};
  const title = a.seoTitle || a.title || "Media";
  const desc = a.seoDescription || a.description || "";
  const thumb = imgUrl(a.seoImage?.data?.attributes?.url || a.thumbnail?.data?.attributes?.url);
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
  if (!data || !data.attributes) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80">
        Media not found.
      </div>
    );
  }
  const a = data.attributes;
  const categoryEntity = a.category?.data?.attributes;
  const categorySlug = categoryEntity?.slug;
  const categoryName = categoryEntity?.name ?? a.legacyCategory ?? undefined;
  const relatedRaw = categorySlug ? await getMediaByCategory(categorySlug, 4) : [];
  const related = (relatedRaw || [])
    .filter((item: MediaItemEntity | null | undefined): item is MediaItemEntity => Boolean(item && item.attributes))
    .filter((item) => item.attributes.slug !== slug)
    .map((item) => {
      const attr = item.attributes!;
      const relCategory = attr.category?.data?.attributes?.name ?? attr.legacyCategory ?? undefined;
      const speakerNames = (attr.speakers?.data || [])
        .map((speaker) => speaker.attributes?.name)
        .filter(Boolean) as string[];

      return {
        title: attr.title,
        href: `/media/${attr.slug}`,
        excerpt: attr.excerpt ?? attr.description,
        category: relCategory,
        thumbnail: { src: attr.thumbnail?.data?.attributes?.url },
        views: attr.views ?? 0,
        durationSec: attr.durationSec ?? undefined,
        speakers: speakerNames,
      };
    });

  const source = a.source;
  let videoUrl: string | undefined;
  let isFileVideo = false;

  if (source?.kind === "file" && source.file?.data?.attributes?.url) {
    videoUrl = imgUrl(source.file.data.attributes.url);
    isFileVideo = true;
  } else if (source?.url) {
    videoUrl = source.url;
  } else if (a.video_url || a.videoUrl) {
    const legacyUrl = a.video_url || a.videoUrl;
    const looksLikeFile = legacyUrl ? /(\.mp4|\.mov|\.webm)$/i.test(legacyUrl) : false;
    videoUrl = looksLikeFile ? imgUrl(legacyUrl) : legacyUrl;
    isFileVideo = looksLikeFile;
  }

  const thumbUrl = imgUrl(a.thumbnail?.data?.attributes?.url);

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
