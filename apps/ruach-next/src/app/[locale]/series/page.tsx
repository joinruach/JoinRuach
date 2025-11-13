import Link from "next/link";
import Image from "next/image";
import { getAllSeries, imgUrl } from "@/lib/strapi";
import { extractAttributes, extractSingleRelation } from "@/lib/strapi-normalize";
import type { SeriesEntity } from "@/lib/types/strapi-types";

export const metadata = {
  title: "Series | Ruach Ministries",
  description: "Explore our curated series of teachings, testimonies, and discipleship content organized by theme.",
};

export const dynamic = "force-dynamic";

type SeriesCardData = {
  title: string;
  slug: string;
  description?: string;
  coverImage?: { src: string; alt: string };
  itemCount: number;
};

export default async function SeriesPage() {
  const series = await getAllSeries();

  const seriesCards: SeriesCardData[] = series.map((s) => {
    const attrs = extractAttributes<SeriesEntity["attributes"]>(s);
    const coverAttributes = extractSingleRelation<{ url?: string; alternativeText?: string }>(attrs?.coverImage);
    const mediaItems = attrs?.mediaItems?.data ?? [];

    return {
      title: attrs?.title ?? "Untitled Series",
      slug: attrs?.slug ?? "",
      description: typeof attrs?.description === "string" ? attrs.description.slice(0, 150) : undefined,
      coverImage: coverAttributes?.url
        ? { src: imgUrl(coverAttributes.url) ?? "", alt: coverAttributes.alternativeText ?? attrs?.title ?? "Series cover" }
        : undefined,
      itemCount: Array.isArray(mediaItems) ? mediaItems.length : 0,
    };
  }).filter(s => s.slug);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <span className="text-xs uppercase tracking-wide text-white/60">Content Collections</span>
        <h1 className="text-3xl font-semibold text-white">Series</h1>
        <p className="text-sm text-white/70">
          Dive deep into themed collections of teachings, testimonies, and discipleship content curated for spiritual growth.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">{seriesCards.length} series available</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {seriesCards.length > 0 ? (
            seriesCards.map((series) => (
              <Link
                key={series.slug}
                href={`/series/${series.slug}`}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10"
              >
                {series.coverImage ? (
                  <div className="relative mb-4 aspect-video overflow-hidden rounded-lg">
                    <Image
                      src={series.coverImage.src}
                      alt={series.coverImage.alt}
                      fill
                      className="object-cover transition group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-white/10">
                    <span className="text-5xl text-white/20">📚</span>
                  </div>
                )}

                <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-amber-300">
                  {series.title}
                </h3>

                {series.description && (
                  <p className="mb-3 text-sm leading-relaxed text-white/70 line-clamp-2">
                    {series.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>{series.itemCount} {series.itemCount === 1 ? 'episode' : 'episodes'}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-sm text-white/60">
                No series available yet. Check back soon for curated content collections.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
