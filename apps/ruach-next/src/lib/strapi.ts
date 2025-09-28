type FetchOpts = {
  tags?: string[];
  authToken?: string;
  revalidate?: number;
  next?: RequestInit["next"];
  headers?: HeadersInit;
};

type StrapiRequestError = Error & {
  status?: number;
  statusText?: string;
  url?: string;
};

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

function resolveUrl(path: string) {
  return path.startsWith("http") ? path : `${STRAPI}${path}`;
}

function createStrapiError(res: Response, url: string): StrapiRequestError {
  const error = new Error(`Strapi request failed ${res.status}`) as StrapiRequestError;
  error.name = "StrapiRequestError";
  error.status = res.status;
  error.statusText = res.statusText;
  error.url = url;
  return error;
}

function isNotFoundError(error: unknown): error is StrapiRequestError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "status" in error &&
      (error as StrapiRequestError).status === 404
  );
}

export async function getJSON<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = resolveUrl(path);
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(opts.authToken ? { Authorization: `Bearer ${opts.authToken}` } : {}),
      ...(opts.headers || {}),
    },
    next: { tags: opts.tags, revalidate: opts.revalidate, ...opts.next },
  });

  if (!res.ok) {
    throw createStrapiError(res, url);
  }

  return res.json() as Promise<T>;
}

export async function postJSON<T>(path: string, body: unknown, opts: FetchOpts = {}): Promise<T> {
  const url = resolveUrl(path);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(opts.authToken ? { Authorization: `Bearer ${opts.authToken}` } : {}),
      ...(opts.headers || {}),
    },
    body: JSON.stringify(body),
    next: { tags: opts.tags, revalidate: opts.revalidate, ...opts.next },
  });

  if (!res.ok) {
    throw createStrapiError(res, url);
  }

  return res.json() as Promise<T>;
}

export async function incrementMediaView(id: number) {
  if (!id) return;
  try {
    await postJSON(`/api/media-items/${id}/view`, {});
  } catch {
    // ignore failures – view counts are best-effort
  }
}

const qs = (o: Record<string, string>) => new URLSearchParams(o).toString();

function isBadRequest(error: unknown): error is StrapiRequestError {
  return Boolean(error && typeof error === "object" && "status" in error && (error as StrapiRequestError).status === 400);
}

function unslugifyCategory(slug: string) {
  if (!slug) return slug;
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

type MediaSort = "latest" | "oldest" | "most-viewed";

type MediaListOptions = {
  categorySlug?: string;
  sort?: MediaSort;
  dateRange?: "30" | "365";
  page?: number;
  pageSize?: number;
};

type StrapiListResponse<T> = {
  data: T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

export async function getCourses() {
  const q = qs({
    "fields[0]": "title",
    "fields[1]": "slug",
    populate: "cover",
    "pagination[pageSize]": "100",
  });

  try {
    const j = await getJSON<{ data: any[] }>(`/api/courses?${q}`, { tags: ["courses"] });
    return j.data || [];
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getCourseBySlug(slug: string) {
  const params = new URLSearchParams();
  params.set("filters[slug][$eq]", slug);
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "excerpt");
  params.set("fields[3]", "description");
  params.set("fields[4]", "seoTitle");
  params.set("fields[5]", "seoDescription");
  params.set("populate[cover][fields][0]", "url");
  params.set("populate[cover][fields][1]", "alternativeText");
  params.set("populate[lessons][fields][0]", "title");
  params.set("populate[lessons][fields][1]", "slug");
  params.set("populate[lessons][fields][2]", "summary");
  params.set("populate[lessons][fields][3]", "order");
  params.set("populate[lessons][fields][4]", "duration");
  params.set("populate[lessons][fields][5]", "videoUrl");
  params.set("populate[lessons][fields][6]", "previewAvailable");
  params.set("populate[lessons][fields][7]", "transcript");
  params.set("populate[lessons][populate][transcriptFile][fields][0]", "url");
  params.set("pagination[pageSize]", "1");

  try {
    const j = await getJSON<{ data: any[] }>(`/api/courses?${params.toString()}`, {
      tags: [`course:${slug}`],
    });
    return j.data?.[0];
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

async function fetchMediaItems(options: MediaListOptions = {}) {
  const params = new URLSearchParams();
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "type");
  params.set("fields[3]", "releasedAt");
  params.set("fields[4]", "excerpt");
  params.set("fields[5]", "views");
  params.set("populate[thumbnail][fields][0]", "url");
  params.set("populate[thumbnail][fields][1]", "alternativeText");
  params.set("populate[category][fields][0]", "name");
  params.set("populate[category][fields][1]", "slug");

  const pageSize = options.pageSize ?? 20;
  params.set("pagination[pageSize]", String(pageSize));
  params.set("pagination[page]", String(options.page ?? 1));

  if (options.categorySlug && options.categorySlug !== "all") {
    params.set("filters[category][slug][$eq]", options.categorySlug);
  }

  if (options.dateRange) {
    const now = new Date();
    const days = options.dateRange === "30" ? 30 : 365;
    now.setDate(now.getDate() - days);
    params.set("filters[releasedAt][$gte]", now.toISOString());
  }

  const sort = options.sort ?? "latest";
  switch (sort) {
    case "oldest":
      params.set("sort[0]", "releasedAt:asc");
      break;
    case "most-viewed":
      params.set("sort[0]", "views:desc");
      params.set("sort[1]", "releasedAt:desc");
      break;
    default:
      params.set("sort[0]", "releasedAt:desc");
  }

  const tag = `media-items:${options.categorySlug ?? "all"}:${sort}:${options.dateRange ?? "all"}:p${
    options.page ?? 1
  }:s${pageSize}`;
  const endpoint = `/api/media-items?${params.toString()}`;

  try {
    const j = await getJSON<StrapiListResponse<any>>(endpoint, { tags: [tag, "media-items"] });
    return {
      data: j.data || [],
      meta: j.meta,
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      return { data: [], meta: undefined };
    }

    throw error;
  }
}

async function fetchMediaItemsLegacy(options: MediaListOptions = {}) {
  const params = new URLSearchParams();
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "excerpt");
  params.set("fields[3]", "category");
  params.set("fields[4]", "releasedAt");
  params.set("populate", "thumbnail");

  const pageSize = options.pageSize ?? 20;
  params.set("pagination[pageSize]", String(pageSize));
  params.set("pagination[page]", String(options.page ?? 1));

  if (options.categorySlug && options.categorySlug !== "all") {
    const legacyName = unslugifyCategory(options.categorySlug);
    params.set("filters[category][$eqi]", legacyName || options.categorySlug);
  }

  if (options.dateRange) {
    const now = new Date();
    const days = options.dateRange === "30" ? 30 : 365;
    now.setDate(now.getDate() - days);
    params.set("filters[releasedAt][$gte]", now.toISOString());
  }

  const sort = options.sort ?? "latest";
  switch (sort) {
    case "oldest":
      params.set("sort[0]", "releasedAt:asc");
      break;
    case "most-viewed":
      params.set("sort[0]", "releasedAt:desc");
      break;
    default:
      params.set("sort[0]", "releasedAt:desc");
  }

  const tag = `media-items:legacy:${options.categorySlug ?? "all"}:${sort}:${options.dateRange ?? "all"}:p${
    options.page ?? 1
  }:s${pageSize}`;

  try {
    const endpoint = `/api/media-items?${params.toString()}`;
    const j = await getJSON<StrapiListResponse<any>>(endpoint, { tags: [tag, "media-items"] });
    return {
      data: j.data || [],
      meta: j.meta,
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      return { data: [], meta: undefined };
    }

    throw error;
  }
}

export async function getMediaItems(options: MediaListOptions = {}) {
  try {
    return await fetchMediaItems(options);
  } catch (error) {
    if (isBadRequest(error)) {
      return fetchMediaItemsLegacy(options);
    }

    throw error;
  }
}

async function fetchMediaBySlug(slug: string) {
  const params = new URLSearchParams();
  params.set("filters[slug][$eq]", slug);
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "description");
  params.set("fields[3]", "durationSec");
  params.set("fields[4]", "publishedAt");
  params.set("fields[5]", "releasedAt");
  params.set("fields[6]", "videoUrl");
  params.set("fields[7]", "excerpt");
  params.set("populate[thumbnail][fields][0]", "url");
  params.set("populate[thumbnail][fields][1]", "alternativeText");
  params.set("populate[category][fields][0]", "name");
  params.set("populate[category][fields][1]", "slug");
  params.set("populate[source][fields][0]", "kind");
  params.set("populate[source][fields][1]", "url");
  params.set("populate[source][fields][2]", "embedId");
  params.set("populate[source][fields][3]", "startSeconds");
  params.set("populate[source][fields][4]", "title");
  params.set("populate[source][populate][file][fields][0]", "url");
  params.set("populate[speakers][fields][0]", "name");
  params.set("populate[speakers][fields][1]", "title");
  params.set("populate[gallery][fields][0]", "url");
  params.set("populate[seoImage][fields][0]", "url");
  params.set("pagination[pageSize]", "1");

  try {
    const j = await getJSON<{ data: any[] }>(`/api/media-items?${params.toString()}`, {
      tags: [`media:${slug}`],
    });
    return j.data?.[0];
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

async function fetchMediaBySlugLegacy(slug: string) {
  const q = qs({
    "filters[slug][$eq]": slug,
    populate: "thumbnail",
    "pagination[pageSize]": "1",
  });

  try {
    const j = await getJSON<{ data: any[] }>(`/api/media-items?${q}`, {
      tags: [`media:${slug}`],
    });
    return j.data?.[0];
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

export async function getMediaBySlug(slug: string) {
  try {
    return await fetchMediaBySlug(slug);
  } catch (error) {
    if (isBadRequest(error)) {
      return fetchMediaBySlugLegacy(slug);
    }

    throw error;
  }
}

export function imgUrl(path?: string) {
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${STRAPI}${path}`;
}

// ------------------------------
// Additional endpoints (homepage)
// ------------------------------
import type {
  CategoryEntity,
  MediaItemEntity,
  PrayerEntity,
  StatEntity,
  EventEntity,
  ConferencePageEntity,
} from "@/lib/types/strapi-types";

async function fetchMediaByCategory(categorySlug: string, limit = 12) {
  const params = new URLSearchParams();
  params.set("filters[category][slug][$eq]", categorySlug);
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "excerpt");
  params.set("fields[3]", "releasedAt");
  params.set("fields[4]", "views");
  params.set("populate[thumbnail][fields][0]", "url");
  params.set("populate[thumbnail][fields][1]", "alternativeText");
  params.set("populate[category][fields][0]", "name");
  params.set("populate[category][fields][1]", "slug");
  params.set("sort[0]", "releasedAt:desc");
  params.set("pagination[pageSize]", String(limit));

  try {
    const j = await getJSON<{ data: MediaItemEntity[] }>(`/api/media-items?${params.toString()}`, {
      tags: [`media-category:${categorySlug}`],
    });
    return j.data || [];
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }
}

async function fetchMediaByCategoryLegacy(category: string, limit = 12) {
  const legacyName = unslugifyCategory(category);
  const fetchSize = Math.max(limit * 3, limit);
  const q = qs({
    "fields[0]": "title",
    "fields[1]": "slug",
    "fields[2]": "description",
    "fields[3]": "category",
    populate: "thumbnail",
    "sort[0]": "publishedAt:desc",
    "pagination[pageSize]": String(fetchSize),
  });

  try {
    const j = await getJSON<{ data: MediaItemEntity[] }>(`/api/media-items?${q}`, {
      tags: [`media-category:${category}`],
    });
    const target = (legacyName || category).toLowerCase();
    const filtered = (j.data || []).filter((item) => {
      const attrCategory = typeof item.attributes.category === "string" ? item.attributes.category : "";
      return attrCategory.toLowerCase() === target;
    });
    return filtered.slice(0, limit);
  } catch (error) {
    if (isBadRequest(error)) {
      return [];
    }
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getMediaByCategory(categorySlug: string, limit = 12) {
  try {
    return await fetchMediaByCategory(categorySlug, limit);
  } catch (error) {
    if (isBadRequest(error)) {
      return fetchMediaByCategoryLegacy(categorySlug, limit);
    }

    throw error;
  }
}

export async function getFeaturedTestimony() {
  // Heuristic: use media-items in category "testimony" as featured
  try {
    const items = await getMediaByCategory("testimony", 1);
    return items?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchMediaCategories(includeEmpty = false) {
  const params = new URLSearchParams();
  params.set("fields[0]", "name");
  params.set("fields[1]", "slug");
  params.set("sort[0]", "name:asc");

  if (!includeEmpty) {
    params.set("filters[mediaItems][id][$notNull]", "true");
  }

  try {
    const j = await getJSON<{ data: CategoryEntity[] }>(`/api/categories?${params.toString()}`, {
      tags: ["media-categories"],
      revalidate: 60,
    });
    return j.data || [];
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }
}

async function fetchMediaCategoriesLegacy(includeEmpty = false) {
  const params = new URLSearchParams();
  params.set("fields[0]", "name");
  params.set("fields[1]", "slug");
  params.set("sort[0]", "name:asc");

  try {
    const j = await getJSON<{ data: CategoryEntity[] }>(`/api/categories?${params.toString()}`, {
      tags: ["media-categories"],
      revalidate: 60,
    });
    const data = j.data || [];
    return includeEmpty ? data : data.filter((category) => Boolean(category?.attributes?.name));
  } catch (error) {
    if (isBadRequest(error) || isNotFoundError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getMediaCategories(includeEmpty = false) {
  try {
    return await fetchMediaCategories(includeEmpty);
  } catch (error) {
    if (isBadRequest(error)) {
      return fetchMediaCategoriesLegacy(includeEmpty);
    }

    throw error;
  }
}

export async function getPrayers(limit = 6) {
  const q = qs({
    "sort[0]": "createdAt:desc",
    "pagination[pageSize]": String(limit),
  });

  try {
    const j = await getJSON<{ data: PrayerEntity[] }>(`/api/prayers?${q}`, {
      tags: ["prayers"],
      revalidate: 60,
    });
    return j.data || [];
  } catch {
    return [] as PrayerEntity[];
  }
}

export async function getImpactStats() {
  const params = new URLSearchParams();
  params.set("pagination[pageSize]", "1");
  params.set("populate[metrics]", "*");

  try {
    const j = await getJSON<{ data: StatEntity[] }>(`/api/stats?${params.toString()}`, {
      tags: ["stats"],
      revalidate: 60,
    });
    return j.data?.[0] ?? null;
  } catch {
    return null as StatEntity | null;
  }
}

export async function getEvents(limit = 6) {
  const params = new URLSearchParams();
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "description");
  params.set("fields[3]", "location");
  params.set("fields[4]", "startDate");
  params.set("fields[5]", "endDate");
  params.set("fields[6]", "timezone");
  params.set("fields[7]", "category");
  params.set("fields[8]", "isOnline");
  params.set("fields[9]", "registrationUrl");
  params.set("fields[10]", "ctaLabel");
  params.set("populate[cover][fields][0]", "url");
  params.set("populate[cover][fields][1]", "alternativeText");
  params.set("populate[heroGallery][fields][0]", "url");
  params.set("sort[0]", "startDate:asc");
  params.set("pagination[pageSize]", String(limit));

  try {
    const j = await getJSON<{ data: EventEntity[] }>(`/api/events?${params.toString()}`, {
      tags: ["events"],
      revalidate: 60,
    });
    return j.data || [];
  } catch {
    return [] as EventEntity[];
  }
}

export async function getEventBySlug(slug: string) {
  const q = qs({
    "filters[slug][$eq]": slug,
    populate: "cover",
    "pagination[pageSize]": "1",
  });

  try {
    const j = await getJSON<{ data: EventEntity[] }>(`/api/events?${q}`, {
      tags: [`event:${slug}`],
      revalidate: 120,
    });
    return j.data?.[0];
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

export async function getConferencePage() {
  const params = new URLSearchParams();
  params.set("populate", "deep,4");

  const endpoints = [
    "/api/conference-page",
    "/api/conferences-page",
    "/api/conference",
  ];

  for (const endpoint of endpoints) {
    try {
      const j = await getJSON<{ data: ConferencePageEntity | null }>(
        `${endpoint}?${params.toString()}`,
        {
          tags: ["conference-page"],
          revalidate: 60,
        }
      );

      if (j.data) {
        return j.data;
      }
    } catch (error) {
      if (isNotFoundError(error)) {
        continue;
      }

      throw error;
    }
  }

  return null as ConferencePageEntity | null;
}
