import { NextRequest, NextResponse } from "next/server";
import { getJSON } from "@/lib/strapi";

// Discriminated union for search results
interface BaseSearchResult {
  id: string;
  title: string;
  slug: string;
  url: string;
  relevanceScore?: number;
}

interface MediaSearchResult extends BaseSearchResult {
  type: 'media';
  excerpt?: string;
  thumbnail?: string;
  publishedAt?: string;
}

interface SeriesSearchResult extends BaseSearchResult {
  type: 'series';
  description?: string;
  thumbnail?: string;
}

interface CourseSearchResult extends BaseSearchResult {
  type: 'course';
  excerpt?: string;
  thumbnail?: string;
}

interface BlogSearchResult extends BaseSearchResult {
  type: 'blog';
  thumbnail?: string;
  publishedAt?: string;
}

interface EventSearchResult extends BaseSearchResult {
  type: 'event';
  description?: string;
  thumbnail?: string;
  startDate?: string;
}

interface ArticleSearchResult extends BaseSearchResult {
  type: 'article';
  description?: string;
  thumbnail?: string;
}

type SearchResult =
  | MediaSearchResult
  | SeriesSearchResult
  | CourseSearchResult
  | BlogSearchResult
  | EventSearchResult
  | ArticleSearchResult;

// Strapi response types
interface MediaItemResponse {
  id: number;
  attributes: {
    title: string;
    slug: string;
    excerpt?: string | null;
    description?: string | null;
    publishedAt?: string | null;
    thumbnail?: {
      data?: {
        attributes?: {
          url?: string;
        } | null;
      } | null;
    } | null;
  };
}

interface SeriesItemResponse {
  id: number;
  attributes: {
    title: string;
    slug: string;
    description?: string | null;
    coverImage?: {
      data?: {
        attributes?: {
          url?: string;
        } | null;
      } | null;
    } | null;
  };
}

interface CourseItemResponse {
  id: number;
  attributes: {
    title: string;
    slug: string;
    excerpt?: string | null;
    description?: string | null;
    cover?: {
      data?: {
        attributes?: {
          url?: string;
        } | null;
      } | null;
    } | null;
  };
}

interface BlogItemResponse {
  id: number;
  attributes: {
    title: string;
    slug: string;
    publishedDate?: string | null;
    featuredImage?: {
      data?: {
        attributes?: {
          url?: string;
        } | null;
      } | null;
    } | null;
  };
}

interface EventItemResponse {
  id: number;
  attributes: {
    title: string;
    slug: string;
    description?: string | null;
    startDate?: string | null;
    cover?: {
      data?: {
        attributes?: {
          url?: string;
        } | null;
      } | null;
    } | null;
  };
}

// Type guards
function isValidMediaItem(item: unknown): item is MediaItemResponse {
  if (!item || typeof item !== 'object') return false;
  const i = item as Partial<MediaItemResponse>;
  return (
    typeof i.id === 'number' &&
    i.attributes !== null &&
    i.attributes !== undefined &&
    typeof i.attributes === 'object' &&
    typeof i.attributes.title === 'string' &&
    typeof i.attributes.slug === 'string'
  );
}

function isValidSeriesItem(item: unknown): item is SeriesItemResponse {
  if (!item || typeof item !== 'object') return false;
  const i = item as Partial<SeriesItemResponse>;
  return (
    typeof i.id === 'number' &&
    i.attributes !== null &&
    i.attributes !== undefined &&
    typeof i.attributes === 'object' &&
    typeof i.attributes.title === 'string' &&
    typeof i.attributes.slug === 'string'
  );
}

function isValidCourseItem(item: unknown): item is CourseItemResponse {
  if (!item || typeof item !== 'object') return false;
  const i = item as Partial<CourseItemResponse>;
  return (
    typeof i.id === 'number' &&
    i.attributes !== null &&
    i.attributes !== undefined &&
    typeof i.attributes === 'object' &&
    typeof i.attributes.title === 'string' &&
    typeof i.attributes.slug === 'string'
  );
}

function isValidBlogItem(item: unknown): item is BlogItemResponse {
  if (!item || typeof item !== 'object') return false;
  const i = item as Partial<BlogItemResponse>;
  return (
    typeof i.id === 'number' &&
    i.attributes !== null &&
    i.attributes !== undefined &&
    typeof i.attributes === 'object' &&
    typeof i.attributes.title === 'string' &&
    typeof i.attributes.slug === 'string'
  );
}

function isValidEventItem(item: unknown): item is EventItemResponse {
  if (!item || typeof item !== 'object') return false;
  const i = item as Partial<EventItemResponse>;
  return (
    typeof i.id === 'number' &&
    i.attributes !== null &&
    i.attributes !== undefined &&
    typeof i.attributes === 'object' &&
    typeof i.attributes.title === 'string' &&
    typeof i.attributes.slug === 'string'
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const type = searchParams.get("type"); // Filter by content type
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  const searchQuery = query.trim();
  const results: SearchResult[] = [];

  try {
    // Search Media Items
    if (!type || type === "media") {
      const mediaParams = new URLSearchParams();
      mediaParams.set("filters[$or][0][title][$containsi]", searchQuery);
      mediaParams.set("filters[$or][1][description][$containsi]", searchQuery);
      mediaParams.set("filters[$or][2][excerpt][$containsi]", searchQuery);
      mediaParams.set("fields[0]", "title");
      mediaParams.set("fields[1]", "slug");
      mediaParams.set("fields[2]", "excerpt");
      mediaParams.set("fields[3]", "publishedAt");
      mediaParams.set("populate[thumbnail][fields][0]", "url");
      mediaParams.set("pagination[pageSize]", String(Math.min(limit, 10)));

      try {
        const mediaData = await getJSON<{ data: unknown[] }>(
          `/api/media-items?${mediaParams.toString()}`,
          { tags: [`search:media:${searchQuery}`], revalidate: 300 }
        );

        const validItems = (mediaData.data || []).filter(isValidMediaItem);

        for (const item of validItems) {
          results.push({
            id: `media-${item.id}`,
            type: "media",
            title: item.attributes.title,
            excerpt: item.attributes.excerpt || item.attributes.description || undefined,
            slug: item.attributes.slug,
            url: `/media/${item.attributes.slug}`,
            thumbnail: item.attributes.thumbnail?.data?.attributes?.url,
            publishedAt: item.attributes.publishedAt || undefined,
          });
        }
      } catch (err) {
        console.error("Media search error:", err);
      }
    }

    // Search Series
    if (!type || type === "series") {
      const seriesParams = new URLSearchParams();
      seriesParams.set("filters[$or][0][title][$containsi]", searchQuery);
      seriesParams.set("filters[$or][1][description][$containsi]", searchQuery);
      seriesParams.set("fields[0]", "title");
      seriesParams.set("fields[1]", "slug");
      seriesParams.set("fields[2]", "description");
      seriesParams.set("populate[coverImage][fields][0]", "url");
      seriesParams.set("pagination[pageSize]", String(Math.min(limit, 5)));

      try {
        const seriesData = await getJSON<{ data: unknown[] }>(
          `/api/series-collection?${seriesParams.toString()}`,
          { tags: [`search:series:${searchQuery}`], revalidate: 300 }
        );

        const validItems = (seriesData.data || []).filter(isValidSeriesItem);

        for (const item of validItems) {
          results.push({
            id: `series-${item.id}`,
            type: "series",
            title: item.attributes.title,
            description: item.attributes.description?.substring(0, 200) || undefined,
            slug: item.attributes.slug,
            url: `/series/${item.attributes.slug}`,
            thumbnail: item.attributes.coverImage?.data?.attributes?.url,
          });
        }
      } catch (err) {
        console.error("Series search error:", err);
      }
    }

    // Search Courses
    if (!type || type === "course") {
      const courseParams = new URLSearchParams();
      courseParams.set("filters[$or][0][title][$containsi]", searchQuery);
      courseParams.set("filters[$or][1][description][$containsi]", searchQuery);
      courseParams.set("filters[$or][2][excerpt][$containsi]", searchQuery);
      courseParams.set("fields[0]", "title");
      courseParams.set("fields[1]", "slug");
      courseParams.set("fields[2]", "excerpt");
      courseParams.set("populate[cover][fields][0]", "url");
      courseParams.set("pagination[pageSize]", String(Math.min(limit, 5)));

      try {
        const courseData = await getJSON<{ data: unknown[] }>(
          `/api/courses?${courseParams.toString()}`,
          { tags: [`search:courses:${searchQuery}`], revalidate: 300 }
        );

        const validItems = (courseData.data || []).filter(isValidCourseItem);

        for (const item of validItems) {
          results.push({
            id: `course-${item.id}`,
            type: "course",
            title: item.attributes.title,
            excerpt: item.attributes.excerpt || item.attributes.description || undefined,
            slug: item.attributes.slug,
            url: `/courses/${item.attributes.slug}`,
            thumbnail: item.attributes.cover?.data?.attributes?.url,
          });
        }
      } catch (err) {
        console.error("Course search error:", err);
      }
    }

    // Search Blog Posts
    if (!type || type === "blog") {
      const blogParams = new URLSearchParams();
      blogParams.set("filters[$or][0][title][$containsi]", searchQuery);
      blogParams.set("fields[0]", "title");
      blogParams.set("fields[1]", "slug");
      blogParams.set("fields[2]", "publishedDate");
      blogParams.set("populate[featuredImage][fields][0]", "url");
      blogParams.set("pagination[pageSize]", String(Math.min(limit, 5)));

      try {
        const blogData = await getJSON<{ data: unknown[] }>(
          `/api/blog-posts?${blogParams.toString()}`,
          { tags: [`search:blog:${searchQuery}`], revalidate: 300 }
        );

        const validItems = (blogData.data || []).filter(isValidBlogItem);

        for (const item of validItems) {
          results.push({
            id: `blog-${item.id}`,
            type: "blog",
            title: item.attributes.title,
            slug: item.attributes.slug,
            url: `/members/posts/${item.attributes.slug}`,
            thumbnail: item.attributes.featuredImage?.data?.attributes?.url,
            publishedAt: item.attributes.publishedDate || undefined,
          });
        }
      } catch (err) {
        console.error("Blog search error:", err);
      }
    }

    // Search Events
    if (!type || type === "event") {
      const eventParams = new URLSearchParams();
      eventParams.set("filters[$or][0][title][$containsi]", searchQuery);
      eventParams.set("filters[$or][1][description][$containsi]", searchQuery);
      eventParams.set("fields[0]", "title");
      eventParams.set("fields[1]", "slug");
      eventParams.set("fields[2]", "description");
      eventParams.set("fields[3]", "startDate");
      eventParams.set("populate[cover][fields][0]", "url");
      eventParams.set("pagination[pageSize]", String(Math.min(limit, 5)));

      try {
        const eventData = await getJSON<{ data: unknown[] }>(
          `/api/events?${eventParams.toString()}`,
          { tags: [`search:events:${searchQuery}`], revalidate: 300 }
        );

        const validItems = (eventData.data || []).filter(isValidEventItem);

        for (const item of validItems) {
          results.push({
            id: `event-${item.id}`,
            type: "event",
            title: item.attributes.title,
            description: item.attributes.description || undefined,
            slug: item.attributes.slug,
            url: `/events/${item.attributes.slug}`,
            thumbnail: item.attributes.cover?.data?.attributes?.url,
            startDate: item.attributes.startDate || undefined,
          });
        }
      } catch (err) {
        console.error("Event search error:", err);
      }
    }

    // Sort results by relevance (simple title match scoring)
    const scoredResults = results.map((result) => {
      const titleLower = result.title.toLowerCase();
      const queryLower = searchQuery.toLowerCase();

      // Exact match gets highest score
      if (titleLower === queryLower) {
        result.relevanceScore = 100;
      }
      // Starts with query gets high score
      else if (titleLower.startsWith(queryLower)) {
        result.relevanceScore = 80;
      }
      // Contains query as whole word
      else if (titleLower.includes(` ${queryLower} `) || titleLower.includes(` ${queryLower}`)) {
        result.relevanceScore = 60;
      }
      // Contains query anywhere
      else if (titleLower.includes(queryLower)) {
        result.relevanceScore = 40;
      }
      // In excerpt/description
      else {
        result.relevanceScore = 20;
      }

      return result;
    });

    // Sort by relevance score descending
    scoredResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    return NextResponse.json({
      query: searchQuery,
      total: scoredResults.length,
      results: scoredResults.slice(0, limit),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
