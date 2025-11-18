import Link from "next-intl/link";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import { getMediaCategories, getMediaItems } from "@/lib/strapi";
import {
  extractAttributes,
  extractManyRelation,
  extractSingleRelation,
} from "@/lib/strapi-normalize";
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
  searchParams: searchParamsPromise
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await searchParamsPromise;
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
        const attrs = extractAttributes<{ name?: string; slug?: string }>(c);
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
  type MediaAttributes = MediaItemEntity["attributes"];

  for (const entity of entities) {
    const attributes = extractAttributes<MediaAttributes>(entity);
    if (!attributes) continue;

    const slugValue = attributes.slug;
    const slug = typeof slugValue === "string" && slugValue.trim().length ? slugValue : undefined;
    if (!slug) continue;

    const rawTitle = attributes.title;
    const title = typeof rawTitle === "string" && rawTitle.trim().length ? rawTitle : "Untitled Media";

    const categoryEntity = extractSingleRelation<{ name?: string; slug?: string }>(attributes.category);
    const speakerNames = extractManyRelation<{ name?: string; displayName?: string }>(attributes.speakers)
      .map((speaker) => speaker.displayName?.trim() || speaker.name)
      .filter((name): name is string => Boolean(name && name.trim()));

    const thumbnailAttributes = extractSingleRelation<{ url?: string; alternativeText?: string }>(attributes.thumbnail);
    const thumbnail = thumbnailAttributes?.url
      ? { src: thumbnailAttributes.url, alt: thumbnailAttributes.alternativeText ?? title }
      : undefined;

    const excerpt =
      typeof attributes.excerpt === "string" && attributes.excerpt.trim().length
        ? attributes.excerpt
        : typeof attributes.description === "string"
          ? attributes.description
          : undefined;

    items.push({
      title,
      href: `/media/${slug}`,
      excerpt,
      category: categoryEntity?.name ?? attributes.legacyCategory ?? undefined,
      thumbnail,
      views: attributes.views ?? 0,
      durationSec: attributes.durationSec ?? undefined,
      speakers: speakerNames,
    });
  }

  const total = meta?.pagination?.total ?? items.length;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Media Library</span>
        <h1 className="text-3xl font-semibold text-foreground">Stories, Teachings, and Films</h1>
        <p className="text-sm text-muted-foreground">
          Watch testimonies of freedom, deep-dive discipleship sessions, and cinematic encounters from Ruach Studios.
        </p>
      </header>

      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-[0_20px_60px_rgba(43,37,30,0.05)]">
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Category</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {categoryOptions.map((option) => (
                <Link
                  key={option.value}
                  href={buildHref(searchParams, "category", option.value)}
                >
                  <span className={`rounded-full px-4 py-1.5 text-sm transition ${
                    option.value === category
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  }`}>
                    {option.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Sort</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <Link
                  key={option.value}
                  href={buildHref(searchParams, "sort", option.value)}
                >
                  <span className={`rounded-full px-4 py-1.5 text-sm transition ${
                    option.value === sort
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  }`}>
                    {option.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Date</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {dateOptions.map((option) => (
                <Link
                  key={option.value}
                  href={buildHref(searchParams, "range", option.value)}
                >
                  <span className={`rounded-full px-4 py-1.5 text-sm transition ${
                    option.value === range
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  }`}>
                    {option.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">{total} media items</h2>
          <Link href="/contact">
            <span className="text-sm font-semibold text-foreground underline decoration-[hsl(var(--primary))] decoration-2 underline-offset-4">Submit a testimony →</span>
          </Link>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 text-foreground">
          {items.length ? (
            <MediaGrid items={items} />
          ) : (
            <p className="text-sm text-muted-foreground">No media found for the selected filters. Try another combination.</p>
          )}
        </div>
      </section>
    </div>
  );
}
