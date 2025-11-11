import { NextRequest, NextResponse } from "next/server";
import { getJSON } from "@/lib/strapi";

type SearchResult = {
  id: string;
  type: "media" | "series" | "course" | "blog" | "event" | "article";
  title: string;
  excerpt?: string;
  slug: string;
  url: string;
  thumbnail?: string;
  publishedAt?: string;
  relevanceScore?: number;
};

export async function GET(request: NextRequest) {
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
        const mediaData = await getJSON<{ data: any[] }>(
          `/api/media-items?${mediaParams.toString()}`,
          { tags: [`search:media:${searchQuery}`], revalidate: 300 }
        );

        (mediaData.data || []).forEach((item) => {
          const attrs = item.attributes;
          results.push({
            id: `media-${item.id}`,
            type: "media",
            title: attrs?.title || "Untitled",
            excerpt: attrs?.excerpt || attrs?.description,
            slug: attrs?.slug,
            url: `/media/${attrs?.slug}`,
            thumbnail: attrs?.thumbnail?.data?.attributes?.url,
            publishedAt: attrs?.publishedAt,
          });
        });
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
        const seriesData = await getJSON<{ data: any[] }>(
          `/api/series-collection?${seriesParams.toString()}`,
          { tags: [`search:series:${searchQuery}`], revalidate: 300 }
        );

        (seriesData.data || []).forEach((item) => {
          const attrs = item.attributes;
          results.push({
            id: `series-${item.id}`,
            type: "series",
            title: attrs?.title || "Untitled Series",
            excerpt: attrs?.description?.substring(0, 200),
            slug: attrs?.slug,
            url: `/series/${attrs?.slug}`,
            thumbnail: attrs?.coverImage?.data?.attributes?.url,
          });
        });
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
        const courseData = await getJSON<{ data: any[] }>(
          `/api/courses?${courseParams.toString()}`,
          { tags: [`search:courses:${searchQuery}`], revalidate: 300 }
        );

        (courseData.data || []).forEach((item) => {
          const attrs = item.attributes;
          results.push({
            id: `course-${item.id}`,
            type: "course",
            title: attrs?.title || "Untitled Course",
            excerpt: attrs?.excerpt || attrs?.description,
            slug: attrs?.slug,
            url: `/courses/${attrs?.slug}`,
            thumbnail: attrs?.cover?.data?.attributes?.url,
          });
        });
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
        const blogData = await getJSON<{ data: any[] }>(
          `/api/blog-posts?${blogParams.toString()}`,
          { tags: [`search:blog:${searchQuery}`], revalidate: 300 }
        );

        (blogData.data || []).forEach((item) => {
          const attrs = item.attributes;
          results.push({
            id: `blog-${item.id}`,
            type: "blog",
            title: attrs?.title || "Untitled Post",
            slug: attrs?.slug,
            url: `/members/posts/${attrs?.slug}`,
            thumbnail: attrs?.featuredImage?.data?.attributes?.url,
            publishedAt: attrs?.publishedDate,
          });
        });
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
        const eventData = await getJSON<{ data: any[] }>(
          `/api/events?${eventParams.toString()}`,
          { tags: [`search:events:${searchQuery}`], revalidate: 300 }
        );

        (eventData.data || []).forEach((item) => {
          const attrs = item.attributes;
          results.push({
            id: `event-${item.id}`,
            type: "event",
            title: attrs?.title || "Untitled Event",
            excerpt: attrs?.description,
            slug: attrs?.slug,
            url: `/events/${attrs?.slug}`,
            thumbnail: attrs?.cover?.data?.attributes?.url,
            publishedAt: attrs?.startDate,
          });
        });
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
