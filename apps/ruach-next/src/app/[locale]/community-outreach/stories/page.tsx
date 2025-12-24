import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import { getOutreachStories } from "@/lib/strapi";
import { mapStoryToMediaCard } from "../story-helpers";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

const FALLBACK_STORIES: MediaCardProps[] = [
  {
    title: "Stories Coming Soon",
    href: "/community-outreach",
    excerpt: "New testimonies from Ruach outreach teams are being prepared.",
    category: "Community Outreach",
  },
];

function parsePageParam(value?: string) {
  if (!value) return 1;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

export async function generateMetadata() {
  return {
    title: "Community Outreach Stories — Ruach Ministries",
    description:
      "Track the testimonies and impact reports coming from Ruach outreach teams in the city.",
  };
}

export default async function OutreachStoriesIndex({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const currentPage = parsePageParam(resolvedSearchParams?.page);
  const stories = await getOutreachStories({ limit: 24, page: currentPage }).catch(() => []);

  const items = stories
    .map(mapStoryToMediaCard)
    .filter((item): item is MediaCardProps => Boolean(item));

  const displayItems = items.length > 0 ? items : FALLBACK_STORIES;

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-10 text-zinc-900 dark:text-white">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Ruach in the City</p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-white">Community Outreach Stories</h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-600 dark:text-white/70">
          Weekly testimonies from city teams sharing the gospel, delivering groceries, praying for
          the sick, and discipling new believers.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <LocalizedLink href="/community-outreach">
            <span className="rounded-full border border-zinc-300 dark:border-white/20 px-4 py-2 text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
              Back to outreach overview
            </span>
          </LocalizedLink>
          <LocalizedLink href="/community-outreach#support">
            <span className="rounded-full bg-amber-400 px-4 py-2 font-semibold text-black transition hover:bg-amber-300">
              Support outreach
            </span>
          </LocalizedLink>
        </div>
      </header>

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white p-8 text-neutral-900">
        <MediaGrid items={displayItems} />
        {items.length === 0 ? (
          <p className="mt-6 text-center text-sm text-neutral-500">
            Publish a story in Strapi to populate this section.
          </p>
        ) : null}
      </section>
    </div>
  );
}
