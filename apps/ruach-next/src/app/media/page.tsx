import Link from "next/link";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import { getMediaCategories, getMediaItems } from "@/lib/strapi";
import type { MediaItemEntity } from "@/lib/types/strapi-types";

export const dynamic = "force-dynamic";

const sortOptions = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "most-viewed", label: "Most Viewed" }
];

const dateOptions = [
  { value: "all", label: "All Dates" },
  { value: "30", label: "Last 30 Days" },
  { value: "365", label: "Past Year" }
];

type MediaCardItem = MediaCardProps & {
  views: number;
  durationSec?: number | null;
  speakers: string[];
};

function getParamValue(param: string | string[] | undefined, fallback: string) {
  if (Array.isArray(param)) return param[0] ?? fallback;
  return param ?? fallback;
}

function buildHref(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
  value: string
) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (k === key) return;
    const normalized = Array.isArray(v) ? v[0] : v;
    if (!normalized || normalized === "") return;
    params.set(k, normalized);
  });
  if (value !== "all") {
    params.set(key, value);
  }
  params.delete("page");
  const query = params.toString();
  return query ? `?${query}` : "";
}

export default async function MediaPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const rawCategory = getParamValue(searchParams.category, "all");
  const category = rawCategory === "all" || rawCategory === "" ? "all" : rawCategory;

  const rawSort = getParamValue(searchParams.sort, "latest");
  const sortOptionsValues = new Set(sortOptions.map((o) => o.value));
  const sort = sortOptionsValues.has(rawSort) ? (rawSort as "latest" | "oldest" | "most-viewed") : "latest";
  const range = getParamValue(searchParams.range, "all");

  const [categories, { data, meta }] = await Promise.all([
    getMediaCategories(),
    getMediaItems({
      categorySlug: category === "all" ? undefined : category,
      sort,
      dateRange: range === "all" ? undefined : (range as "30" | "365"),
      pageSize: 18,
    }),
  ]);

  const seenCategorySlugs = new Set<string>();
  const categoryOptions = [
    { value: "all", label: "All" },
    ...categories
      .map((c) => {
        const attrs = c?.attributes;
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

  const items: MediaCardItem[] = [];
  const entities = Array.isArray(data) ? data : [];

  for (const entity of entities) {
    const attributes = ((entity as MediaItemEntity | undefined)?.attributes ?? (entity as any) ?? {}) as Record<string, any>;

    const slugValue = attributes?.slug;
    const slug = typeof slugValue === "string" && slugValue.trim().length ? slugValue : undefined;
    if (!slug) continue;

    const rawTitle = attributes?.title;
    const title = typeof rawTitle === "string" && rawTitle.trim().length ? rawTitle : "Untitled Media";

    const categoryEntity = attributes?.category?.data?.attributes;
    const speakerData = Array.isArray(attributes?.speakers?.data)
      ? (attributes.speakers.data as Array<{ attributes?: { name?: string } }>)
      : [];
    const speakerNames = speakerData
      .map((speaker) => speaker?.attributes?.name)
      .filter((name): name is string => Boolean(name));

    const thumbnailData = attributes?.thumbnail?.data?.attributes;
    const thumbnail = thumbnailData?.url
      ? { src: thumbnailData.url ?? undefined, alt: thumbnailData.alternativeText ?? title }
      : undefined;

    const excerpt = (typeof attributes?.excerpt === "string" && attributes.excerpt.trim().length
      ? attributes.excerpt
      : typeof attributes?.description === "string"
        ? attributes.description
        : undefined);

    items.push({
      title,
      href: `/media/${slug}`,
      excerpt,
      category: categoryEntity?.name ?? attributes?.legacyCategory ?? undefined,
      thumbnail,
      views: attributes?.views ?? 0,
      durationSec: attributes?.durationSec ?? undefined,
      speakers: speakerNames,
    });
  }

  const total = meta?.pagination?.total ?? items.length;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <span className="text-xs uppercase tracking-wide text-white/60">Media Library</span>
        <h1 className="text-3xl font-semibold text-white">Stories, Teachings, and Films</h1>
        <p className="text-sm text-white/70">
          Watch testimonies of freedom, deep-dive discipleship sessions, and cinematic encounters from Ruach Studios.
        </p>
      </header>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/50">Category</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {categoryOptions.map((option) => (
                <Link
                  key={option.value}
                  href={buildHref(searchParams, "category", option.value)}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${
                    option.value === category
                      ? "bg-amber-400 text-black"
                      : "border border-white/10 text-white/70 hover:border-white hover:text-white"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-white/50">Sort</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <Link
                  key={option.value}
                  href={buildHref(searchParams, "sort", option.value)}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${
                    option.value === sort
                      ? "bg-amber-400 text-black"
                      : "border border-white/10 text-white/70 hover:border-white hover:text-white"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-white/50">Date</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {dateOptions.map((option) => (
                <Link
                  key={option.value}
                  href={buildHref(searchParams, "range", option.value)}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${
                    option.value === range
                      ? "bg-amber-400 text-black"
                      : "border border-white/10 text-white/70 hover:border-white hover:text-white"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">{total} media items</h2>
          <Link href="/contact" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
            Submit a testimony →
          </Link>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white p-8 text-neutral-900">
          {items.length ? (
            <MediaGrid items={items} />
          ) : (
            <p className="text-sm text-neutral-600">No media found for the selected filters. Try another combination.</p>
          )}
        </div>
      </section>
    </div>
  );
}
