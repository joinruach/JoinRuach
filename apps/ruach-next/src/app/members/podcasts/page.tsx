import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import Link from "next/link";
import { requireActiveMembership } from "@/lib/require-membership";
import { getMediaItems } from "@/lib/strapi";
import type { MediaItemEntity } from "@/lib/types/strapi-types";

export const dynamic = "force-dynamic";

export default async function MemberPodcastsPage() {
  const path = "/members/podcasts";
  await requireActiveMembership(path);

  const { data } = await getMediaItems({
    type: "podcast",
    pageSize: 18,
  });

  const items: MediaCardProps[] = (data || [])
    .map((entity: MediaItemEntity | undefined | null) => {
      if (!entity?.attributes) return null;
      const attr = entity.attributes;
      const slug = attr.slug;
      if (!slug) return null;
      const title = attr.title ?? "Podcast";
      const thumbnailData = attr.thumbnail?.data?.attributes;
      const thumbnail = thumbnailData?.url
        ? { src: thumbnailData.url, alt: thumbnailData.alternativeText ?? title }
        : undefined;
      const excerpt =
        attr.excerpt && attr.excerpt.trim().length
          ? attr.excerpt
          : attr.description ?? undefined;
      const speakers = Array.isArray(attr.speakers?.data)
        ? attr.speakers.data
            .map((speaker) => speaker?.attributes?.name)
            .filter((value): value is string => Boolean(value))
        : [];

      return {
        title,
        href: `/members/podcasts/${slug}`,
        excerpt,
        category: "Podcast",
        thumbnail,
        views: attr.views ?? 0,
        durationSec: attr.durationSec ?? undefined,
        speakers,
      } satisfies MediaCardProps;
    })
    .filter((item): item is MediaCardProps => Boolean(item));

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <span className="text-xs uppercase tracking-[0.35em] text-white/60">Member Library</span>
        <h1 className="text-3xl font-semibold text-white">Members-Only Podcasts</h1>
        <p className="max-w-2xl text-sm text-white/70">
          Stream extended interviews, prophetic roundtables, and audio encounters produced exclusively for Ruach partners.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">{items.length} podcast episodes</h2>
          <Link href="/members/downloads" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
            Explore downloads →
          </Link>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white p-8 text-neutral-900">
          {items.length ? (
            <MediaGrid items={items} />
          ) : (
            <p className="text-sm text-neutral-600">
              No podcast episodes are available yet. Check back soon for new partner exclusives.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
