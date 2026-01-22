import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

/**
 * GET /api/media/library
 *
 * Returns collections (series) and standalone media items
 */
export async function GET() {
  try {
    // Fetch collections (series with published episodes)
    const collectionsParams = new URLSearchParams({
      "filters[visibility][$eq]": "public",
      "populate[poster][fields][0]": "url",
      "populate[poster][fields][1]": "alternativeText",
      "populate[coverImage][fields][0]": "url",
      "populate[coverImage][fields][1]": "alternativeText",
      "populate[heroBackdrop][fields][0]": "url",
      "populate[heroBackdrop][fields][1]": "alternativeText",
      "sort[0]": "featured:desc",
      "sort[1]": "publishedAt:desc",
      "pagination[pageSize]": "50",
    });

    const collectionsRes = await fetch(
      `${STRAPI_URL}/api/series-collection?${collectionsParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        next: {
          revalidate: 300, // 5 minutes
          tags: ["media-library", "collections"],
        },
      }
    );

    // Fetch standalone media items (not part of a series)
    const standaloneParams = new URLSearchParams({
      "filters[visibility][$eq]": "public",
      "filters[itemType][$eq]": "standalone",
      "populate[thumbnail][fields][0]": "url",
      "populate[thumbnail][fields][1]": "alternativeText",
      "populate[category][fields][0]": "name",
      "populate[category][fields][1]": "slug",
      "populate[speakers][fields][0]": "name",
      "populate[speakers][fields][1]": "displayName",
      "populate[source][fields][0]": "kind",
      "populate[source][fields][1]": "url",
      "populate[source][fields][2]": "embedId",
      "populate[source][populate][file][fields][0]": "url",
      "sort[0]": "featured:desc",
      "sort[1]": "publishedAt:desc",
      "pagination[pageSize]": "50",
    });

    const standaloneRes = await fetch(
      `${STRAPI_URL}/api/media-items?${standaloneParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        next: {
          revalidate: 300, // 5 minutes
          tags: ["media-library", "standalone"],
        },
      }
    );

    // Handle responses gracefully - one can fail without breaking the other
    let collections = { data: [] };
    let standalone = { data: [] };

    if (collectionsRes.ok) {
      collections = await collectionsRes.json();
    } else {
      console.warn("Collections fetch failed:", {
        status: collectionsRes.status,
        statusText: collectionsRes.statusText,
      });
    }

    if (standaloneRes.ok) {
      standalone = await standaloneRes.json();
    } else {
      console.warn("Standalone fetch failed:", {
        status: standaloneRes.status,
        statusText: standaloneRes.statusText,
      });
    }

    return NextResponse.json({
      collections: collections.data || [],
      standalone: standalone.data || [],
    });
  } catch (error) {
    console.error("Error in /api/media/library:", error);
    return NextResponse.json(
      {
        collections: [],
        standalone: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
