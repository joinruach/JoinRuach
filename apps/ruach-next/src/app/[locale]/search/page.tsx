import { Suspense } from "react";
import Link from "next-intl/link";
import Image from "next/image";
import { imgUrl } from "@/lib/strapi";

export const metadata = {
  title: "Search | Ruach Ministries",
  description: "Search for teachings, testimonies, courses, and more from Ruach Ministries.",
};

export const dynamic = "force-dynamic";

type SearchResult = {
  id: string;
  type: "media" | "series" | "course" | "blog" | "event" | "article";
  title: string;
  excerpt?: string;
  slug: string;
  url: string;
  thumbnail?: string;
  publishedAt?: string;
};

const contentTypeLabels: Record<string, string> = {
  media: "Media",
  series: "Series",
  course: "Course",
  blog: "Blog Post",
  event: "Event",
  article: "Article",
};

const contentTypeColors: Record<string, string> = {
  media: "bg-purple-100 text-purple-700",
  series: "bg-blue-100 text-blue-700",
  course: "bg-green-100 text-green-700",
  blog: "bg-amber-100 text-amber-700",
  event: "bg-red-100 text-red-700",
  article: "bg-gray-100 text-gray-700",
};

async function SearchResults({ query, type }: { query: string; type?: string }) {
  if (!query || query.length < 2) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
        <p className="text-white/60">
          Enter at least 2 characters to search
        </p>
      </div>
    );
  }

  try {
    const params = new URLSearchParams({ q: query, limit: "30" });
    if (type && type !== "all") {
      params.set("type", type);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/search?${params.toString()}`, {
      cache: 'no-store', // Always fetch fresh at runtime, never during build
    });

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const data = await response.json();
    const results: SearchResult[] = data.results || [];

    if (results.length === 0) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center space-y-4">
          <div className="text-5xl">🔍</div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">No Results Found</h3>
            <p className="text-sm text-white/60">
              Try searching with different keywords or browse our content categories.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <Link href="/media">
              <span className="text-sm text-amber-300 hover:text-amber-200">Browse Media →</span>
            </Link>
            <Link href="/courses">
              <span className="text-sm text-amber-300 hover:text-amber-200">Browse Courses →</span>
            </Link>
            <Link href="/series">
              <span className="text-sm text-amber-300 hover:text-amber-200">Browse Series →</span>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-white/70">
          Found {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </p>

        <div className="space-y-4">
          {results.map((result) => (
            <Link
              key={result.id}
              href={result.url}
            >
              <div className="group flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10">
              {/* Thumbnail */}
              {result.thumbnail ? (
                <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={imgUrl(result.thumbnail) || ""}
                    alt={result.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-32 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <span className="text-2xl">
                    {result.type === "media" && "🎥"}
                    {result.type === "series" && "📚"}
                    {result.type === "course" && "📖"}
                    {result.type === "blog" && "✍️"}
                    {result.type === "event" && "📅"}
                    {result.type === "article" && "📄"}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start gap-3">
                  <h3 className="text-lg font-semibold text-white group-hover:text-amber-300 line-clamp-2">
                    {result.title}
                  </h3>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      contentTypeColors[result.type] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {contentTypeLabels[result.type] || result.type}
                  </span>
                </div>

                {result.excerpt && (
                  <p className="text-sm text-white/70 line-clamp-2">{result.excerpt}</p>
                )}

                {result.publishedAt && (
                  <p className="text-xs text-white/50">
                    {new Date(result.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
            </Link>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Search error:", error);
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-12 text-center">
        <p className="text-red-200">
          Unable to perform search. Please try again later.
        </p>
      </div>
    );
  }
}

export default async function SearchPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Await params (Next.js 15 requirement)
  await params;

  const searchParams = await searchParamsPromise;
  const query = typeof searchParams.q === "string" ? searchParams.q : "";
  const type = typeof searchParams.type === "string" ? searchParams.type : "all";

  const typeOptions = [
    { value: "all", label: "All Content" },
    { value: "media", label: "Media" },
    { value: "series", label: "Series" },
    { value: "course", label: "Courses" },
    { value: "blog", label: "Blog Posts" },
    { value: "event", label: "Events" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <h1 className="text-3xl font-bold text-white">Search</h1>

        {/* Search Form */}
        <form method="GET" action="/search" className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search for teachings, testimonies, courses..."
              className="flex-1 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-white placeholder-white/50 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              autoFocus
            />
            <button
              type="submit"
              className="rounded-full bg-amber-400 px-8 py-3 font-semibold text-black transition hover:bg-amber-500"
            >
              Search
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="submit"
                name="type"
                value={option.value}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  type === option.value
                    ? "bg-amber-400 text-black"
                    : "border border-white/10 text-white/70 hover:border-white hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </form>
      </header>

      {/* Results */}
      <Suspense
        fallback={
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="h-24 w-32 rounded-lg bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-3/4 rounded bg-white/10" />
                  <div className="h-4 w-full rounded bg-white/10" />
                  <div className="h-3 w-32 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <SearchResults query={query} type={type} />
      </Suspense>
    </div>
  );
}
