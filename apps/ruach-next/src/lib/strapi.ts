import type {
  CategoryEntity,
  MediaItemEntity,
  PrayerEntity,
  StatEntity,
  EventEntity,
  ConferencePageEntity,
  CourseEntity,
  CommunityOutreachPageEntity,
  OutreachStoryEntity,
  OutreachCampaignEntity,
  ScriptureWorkEntity,
  ScriptureVerseEntity,
} from "@/lib/types/strapi-types";

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
const MEDIA_CDN = process.env.NEXT_PUBLIC_MEDIA_CDN_URL || 'https://cdn.joinruach.org';

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

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (typeof error.message === "string" && error.message.toLowerCase().includes("fetch failed")) {
    return true;
  }

  const cause = (error as { cause?: unknown }).cause;
  if (cause && typeof cause === "object") {
    const code = (cause as { code?: unknown }).code;
    if (typeof code === "string") {
      return ["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "EAI_AGAIN"].includes(code);
    }
  }

  return false;
}

function isNotFoundOrNetwork(error: unknown): boolean {
  return isNotFoundError(error) || isNetworkError(error);
}

export async function getJSON<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = resolveUrl(path);

  // Check if draft mode is enabled (for Next.js preview functionality)
  let isDraftMode = false;
  try {
    // Import draftMode from next/headers for server-side draft mode detection
    const { draftMode } = await import('next/headers');
    const draft = await draftMode();
    isDraftMode = draft.isEnabled;
  } catch {
    // draftMode is only available in server components
    // If we're in a client component or context where it's not available, skip
    isDraftMode = false;
  }

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(opts.authToken ? { Authorization: `Bearer ${opts.authToken}` } : {}),
      // Enable content source maps in preview mode for Live Preview
      ...(isDraftMode ? { "strapi-encode-source-maps": "true" } : {}),
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
  type?: string;
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

// Rich text content block type (Strapi blocks format)
interface RichTextBlock {
  type: string;
  children?: Array<{
    type?: string;
    text?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export type BlogPostEntity = {
  id: number;
  attributes?: {
    title?: string;
    slug?: string;
    publishedDate?: string | null;
    content?: RichTextBlock[] | null;
    featuredImage?: {
      data?: {
        attributes?: {
          url?: string;
          alternativeText?: string | null;
        } | null;
      } | null;
    } | null;
    team_member?: {
      data?: {
        attributes?: {
          name?: string | null;
          title?: string | null;
        } | null;
      } | null;
    } | null;
  };
};

export type ResourceLinkComponent = {
  id?: number;
  label?: string;
  url?: string;
  requiresLogin?: boolean;
  type?: "notes" | "download" | "registration" | "external" | "assignment";
};

export type LessonEntity = {
  id: number;
  attributes?: {
    title?: string;
    slug?: string;
    summary?: string | null;
    previewAvailable?: boolean;
    category?: { data?: CategoryEntity | null };
    course?: { data?: { attributes?: { title?: string | null } } | null };
    resources?: ResourceLinkComponent[];
  };
};

export type ArticleEntity = {
  id: number;
  attributes?: {
    title?: string;
    slug?: string;
    description?: string | null;
    cover?: {
      data?: {
        attributes?: {
          url?: string;
          alternativeText?: string | null;
        } | null;
      } | null;
    } | null;
    category?: { data?: CategoryEntity | null };
  };
};

export type ResourceSectionType = "media" | "lesson" | "article" | "course" | "custom";

export type ResourceHighlight = {
  id: number;
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  accentColor?: string | null;
};

type ResourceCardComponent = {
  id?: number;
  title?: string;
  description?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  type?: string | null;
  tag?: string | null;
  image?: {
    data?: {
      attributes?: {
        url?: string;
        alternativeText?: string | null;
      } | null;
    } | null;
  } | null;
  category?: { data?: CategoryEntity | null };
  highlightedMediaItems?: { data?: MediaItemEntity[] };
  highlightedLessons?: { data?: LessonEntity[] };
  highlightedArticles?: { data?: ArticleEntity[] };
  highlightedCourses?: { data?: CourseEntity[] };
  highlightedBlogPosts?: { data?: BlogPostEntity[] };
  customResources?: ResourceLinkComponent[];
};

type ResourceDirectoryEntity = {
  id?: number;
  attributes?: {
    title?: string | null;
    heroCopy?: string | null;
    seo?: {
      metaTitle?: string | null;
      metaDescription?: string | null;
      shareImage?: {
        data?: {
          attributes?: {
            url?: string | null;
          } | null;
        } | null;
      } | null;
    } | null;
    highlights?: Array<{
      id?: number;
      eyebrow?: string | null;
      title?: string;
      description?: string | null;
      ctaLabel?: string | null;
      ctaUrl?: string | null;
      accentColor?: string | null;
    }>;
    sections?: ResourceCardComponent[];
    featuredMediaItems?: { data?: MediaItemEntity[] };
    featuredLessons?: { data?: LessonEntity[] };
    featuredArticles?: { data?: ArticleEntity[] };
    featuredBlogPosts?: { data?: BlogPostEntity[] };
  };
};

export type ResourceSection = {
  id: number;
  title: string;
  description?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  type: ResourceSectionType;
  tag?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  image?: {
    url?: string;
    alternativeText?: string | null;
  } | null;
  highlightedMediaItems: MediaItemEntity[];
  highlightedLessons: LessonEntity[];
  highlightedArticles: ArticleEntity[];
  highlightedBlogPosts: BlogPostEntity[];
  highlightedCourses: CourseEntity[];
  customResources: ResourceLinkComponent[];
};

export type ResourceDirectory = {
  id: number | null;
  title?: string | null;
  heroCopy?: string | null;
  seo?: {
    metaTitle?: string | null;
    metaDescription?: string | null;
    shareImageUrl?: string | null;
  } | null;
  highlights: ResourceHighlight[];
  sections: ResourceSection[];
  featuredMediaItems: MediaItemEntity[];
  featuredLessons: LessonEntity[];
  featuredArticles: ArticleEntity[];
  featuredBlogPosts: BlogPostEntity[];
};

type BlogPostListOptions = {
  page?: number;
  pageSize?: number;
};

export async function getCourses() {
  const q = qs({
    "fields[0]": "title",
    "fields[1]": "slug",
    populate: "cover",
    "pagination[pageSize]": "100",
  });

  try {
    const j = await getJSON<{ data: CourseEntity[] }>(`/api/courses?${q}`, { tags: ["courses"] });
    return j.data || [];
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return [] as CourseEntity[];
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
    const j = await getJSON<{ data: CourseEntity[] }>(`/api/courses?${params.toString()}`, {
      tags: [`course:${slug}`],
    });
    return j.data?.[0];
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return undefined;
    }

    throw error;
  }
}

export async function getBlogPosts(options: BlogPostListOptions = {}) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 12;

  const params = new URLSearchParams();
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "publishedDate");
  params.set("populate[featuredImage][fields][0]", "url");
  params.set("populate[featuredImage][fields][1]", "alternativeText");
  params.set("populate[team_member][fields][0]", "name");
  params.set("populate[team_member][fields][1]", "title");
  params.set("sort[0]", "publishedDate:desc");
  params.set("sort[1]", "createdAt:desc");
  params.set("pagination[pageSize]", String(pageSize));
  params.set("pagination[page]", String(page));

  try {
    const j = await getJSON<StrapiListResponse<BlogPostEntity>>(`/api/blog-posts?${params.toString()}`, {
      tags: [`blog-posts:p${page}:s${pageSize}`],
      revalidate: 300,
    });
    return {
      data: j.data || [],
      meta: j.meta,
    };
  } catch (error) {
    if (isNotFoundOrNetwork(error) || isBadRequest(error)) {
      return { data: [], meta: undefined };
    }

    throw error;
  }
}

export async function getBlogPostBySlug(slug: string) {
  const params = new URLSearchParams();
  params.set("filters[slug][$eq]", slug);
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "publishedDate");
  params.set("populate[content]", "*");
  params.set("populate[featuredImage][fields][0]", "url");
  params.set("populate[featuredImage][fields][1]", "alternativeText");
  params.set("populate[team_member][fields][0]", "name");
  params.set("populate[team_member][fields][1]", "title");
  params.set("populate[team_member][populate][photo][fields][0]", "url");
  params.set("pagination[pageSize]", "1");

  try {
    const j = await getJSON<{ data: BlogPostEntity[] }>(`/api/blog-posts?${params.toString()}`, {
      tags: [`blog-post:${slug}`],
      revalidate: 300,
    });
    return j.data?.[0] ?? null;
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return null;
    }

    throw error;
  }
}

type ArticleListOptions = {
  categorySlug?: string;
  limit?: number;
};

export async function getArticles(options: ArticleListOptions = {}) {
  const limit = Math.min(options.limit ?? 12, 50);
  const params = new URLSearchParams();
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "description");
  params.set("populate[cover][fields][0]", "url");
  params.set("populate[cover][fields][1]", "alternativeText");
  params.set("populate[category][fields][0]", "name");
  params.set("populate[category][fields][1]", "slug");
  params.set("sort[0]", "publishedAt:desc");
  params.set("sort[1]", "updatedAt:desc");
  params.set("pagination[pageSize]", String(limit));

  if (options.categorySlug) {
    params.set("filters[category][slug][$eq]", options.categorySlug);
  }

  try {
    const j = await getJSON<{ data: ArticleEntity[] }>(`/api/articles?${params.toString()}`, {
      tags: [`articles:${options.categorySlug ?? "all"}:l${limit}`],
      revalidate: 300,
    });
    return j.data || [];
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return [] as ArticleEntity[];
    }

    throw error;
  }
}

type DownloadableMediaOptions = {
  page?: number;
  pageSize?: number;
  type?: string;
};

export async function getDownloadableMediaItems(options: DownloadableMediaOptions = {}) {
  const page = options.page ?? 1;
  const pageSize = Math.min(options.pageSize ?? 24, 50);

  const params = new URLSearchParams();
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "description");
  params.set("fields[3]", "ctaLabel");
  params.set("fields[4]", "ctaUrl");
  params.set("fields[5]", "releasedAt");
  params.set("fields[6]", "type");
  params.set("populate[source][fields][0]", "kind");
  params.set("populate[source][fields][1]", "url");
  params.set("populate[source][fields][2]", "title");
  params.set("populate[source][populate][file][fields][0]", "url");
  params.set("populate[thumbnail][fields][0]", "url");
  params.set("populate[thumbnail][fields][1]", "alternativeText");
  params.set("sort[0]", "releasedAt:desc");
  params.set("pagination[pageSize]", String(pageSize));
  params.set("pagination[page]", String(page));

  if (options.type) {
    params.set("filters[type][$eq]", options.type);
  }

  try {
    const j = await getJSON<StrapiListResponse<MediaItemEntity>>(`/api/media-items?${params.toString()}`, {
      tags: [
        `downloadables:${options.type ?? "all"}:p${page}:s${pageSize}`,
      ],
      revalidate: 300,
    });

    const data = (j.data || []).filter((item) => {
      const attributes = item?.attributes;
      if (!attributes) return false;
      const source = attributes.source;
      const fileUrl = source?.file?.data?.attributes?.url;
      const directUrl = source?.url;
      const ctaUrl = attributes.ctaUrl;
      return Boolean(fileUrl || directUrl || ctaUrl);
    });

    return {
      data,
      meta: j.meta,
    };
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return { data: [], meta: undefined };
    }

    throw error;
  }
}

type LessonListOptions = {
  categorySlug?: string;
  courseSlug?: string;
  limit?: number;
};

export async function getLessons(options: LessonListOptions = {}) {
  const params = new URLSearchParams();
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "summary");
  params.set("fields[3]", "previewAvailable");
  params.set("populate[resources]", "*");
  params.set("populate[category][fields][0]", "name");
  params.set("populate[category][fields][1]", "slug");
  params.set("populate[course][fields][0]", "title");
  params.set("populate[course][fields][1]", "slug");
  params.set("sort[0]", "order:asc");
  params.set("sort[1]", "publishedAt:desc");

  const pageSize = Math.min(options.limit ?? 20, 50);
  params.set("pagination[pageSize]", String(pageSize));
  params.set("pagination[page]", "1");

  if (options.categorySlug) {
    params.set("filters[category][slug][$eq]", options.categorySlug);
  }

  if (options.courseSlug) {
    params.set("filters[course][slug][$eq]", options.courseSlug);
  }

  try {
    const j = await getJSON<{ data: LessonEntity[] }>(`/api/lessons?${params.toString()}`, {
      tags: [
        `lessons:${options.categorySlug ?? "all"}:${options.courseSlug ?? "all"}:l${pageSize}`,
      ],
      revalidate: 300,
    });
    return j.data || [];
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return [] as LessonEntity[];
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
  params.set("populate[speakers][fields][0]", "name");
  params.set("populate[speakers][fields][1]", "displayName");
  params.set("populate[speakers][fields][2]", "title");

  const pageSize = options.pageSize ?? 20;
  params.set("pagination[pageSize]", String(pageSize));
  params.set("pagination[page]", String(options.page ?? 1));

  if (options.categorySlug && options.categorySlug !== "all") {
    params.set("filters[category][slug][$eq]", options.categorySlug);
  }

  if (options.type) {
    params.set("filters[type][$eq]", options.type);
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

  const tag = `media-items:${options.categorySlug ?? "all"}:${options.type ?? "all-types"}:${sort}:${
    options.dateRange ?? "all"
  }:p${
    options.page ?? 1
  }:s${pageSize}`;
  const endpoint = `/api/media-items?${params.toString()}`;

  try {
    const j = await getJSON<StrapiListResponse<MediaItemEntity>>(endpoint, { tags: [tag, "media-items"] });
    return {
      data: j.data || [],
      meta: j.meta,
    };
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
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

  if (options.type) {
    params.set("filters[type][$eq]", options.type);
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

  const tag = `media-items:legacy:${options.categorySlug ?? "all"}:${options.type ?? "all-types"}:${sort}:${
    options.dateRange ?? "all"
  }:p${
    options.page ?? 1
  }:s${pageSize}`;

  try {
    const endpoint = `/api/media-items?${params.toString()}`;
    const j = await getJSON<StrapiListResponse<MediaItemEntity>>(endpoint, { tags: [tag, "media-items"] });
    return {
      data: j.data || [],
      meta: j.meta,
    };
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
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
  params.set("populate[speakers][fields][0]", "name");
  params.set("populate[speakers][fields][1]", "displayName");
  params.set("populate[speakers][fields][2]", "title");
  params.set("populate[source][fields][0]", "kind");
  params.set("populate[source][fields][1]", "url");
  params.set("populate[source][fields][2]", "embedId");
  params.set("populate[source][fields][3]", "startSeconds");
  params.set("populate[source][fields][4]", "title");
  params.set("populate[source][populate][file][fields][0]", "url");
  params.set("populate[gallery][fields][0]", "url");
  params.set("populate[seoImage][fields][0]", "url");
  params.set("pagination[pageSize]", "1");

  try {
    const j = await getJSON<{ data: MediaItemEntity[] }>(`/api/media-items?${params.toString()}`, {
      tags: [`media:${slug}`],
    });
    return j.data?.[0];
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
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
    const j = await getJSON<{ data: MediaItemEntity[] }>(`/api/media-items?${q}`, {
      tags: [`media:${slug}`],
    });
    return j.data?.[0];
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
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

export function getMediaUrl(url?: string | null) {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("http")) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname.endsWith(".r2.cloudflarestorage.com")) {
        const segments = parsed.pathname.split("/").filter(Boolean);
        const filename = segments[segments.length - 1];
        if (filename) {
          const base = MEDIA_CDN.endsWith("/") ? MEDIA_CDN.slice(0, -1) : MEDIA_CDN;
          return `${base}/${filename}`;
        }
      }
    } catch {
      // ignore parsing issues and fall back to the raw value
    }
    return trimmed;
  }

  const base = MEDIA_CDN.endsWith("/") ? MEDIA_CDN.slice(0, -1) : MEDIA_CDN;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

export function imgUrl(path?: string | null) {
  return getMediaUrl(path);
}

// ------------------------------
// Additional endpoints (homepage)
// ------------------------------

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
  params.set("populate[speakers][fields][0]", "name");
  params.set("populate[speakers][fields][1]", "displayName");
  params.set("populate[speakers][fields][2]", "title");
  params.set("sort[0]", "releasedAt:desc");
  params.set("pagination[pageSize]", String(limit));

  try {
    const j = await getJSON<{ data: MediaItemEntity[] }>(`/api/media-items?${params.toString()}`, {
      tags: [`media-category:${categorySlug}`],
    });
    return j.data || [];
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
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
    if (isNotFoundOrNetwork(error)) {
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
    if (isNotFoundOrNetwork(error)) {
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
    if (isBadRequest(error) || isNotFoundOrNetwork(error)) {
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

function relationToArray<T>(relation: { data?: unknown } | null | undefined): T[] {
  const data = relation?.data;
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is T => Boolean(item));
}

// Type for raw highlight entry from Strapi
interface RawHighlightEntry {
  id?: number;
  eyebrow?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  accentColor?: string;
}

function mapHighlightEntry(entry: unknown, index: number): ResourceHighlight | null {
  if (!entry || typeof entry !== 'object') return null;

  const raw = entry as RawHighlightEntry;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return null;

  return {
    id: typeof raw.id === "number" ? raw.id : index,
    eyebrow: typeof raw.eyebrow === "string" ? raw.eyebrow : null,
    title,
    description: typeof raw.description === "string" ? raw.description : null,
    ctaLabel: typeof raw.ctaLabel === "string" ? raw.ctaLabel : null,
    ctaUrl: typeof raw.ctaUrl === "string" ? raw.ctaUrl : null,
    accentColor: typeof raw.accentColor === "string" ? raw.accentColor : null,
  };
}

function mapSectionEntry(section: ResourceCardComponent | undefined, index: number): ResourceSection | null {
  if (!section) return null;
  const title = typeof section.title === "string" ? section.title.trim() : "";
  if (!title) return null;

  const allowedTypes: ResourceSectionType[] = ["media", "lesson", "article", "course", "custom"];
  const type = allowedTypes.includes(section.type as ResourceSectionType)
    ? (section.type as ResourceSectionType)
    : "custom";

  const categoryAttributes = section.category?.data?.attributes;
  const imageAttributes = section.image?.data?.attributes;

  const customResources: ResourceLinkComponent[] = [];
  if (Array.isArray(section.customResources)) {
    for (const resource of section.customResources) {
      if (!resource) continue;
      const label = typeof resource.label === "string" ? resource.label.trim() : "";
      const url = typeof resource.url === "string" ? resource.url.trim() : "";
      if (!label || !url) continue;
      const requiresLogin =
        typeof resource.requiresLogin === "boolean" ? resource.requiresLogin : false;
      const linkType =
        typeof resource.type === "string"
          ? (resource.type as ResourceLinkComponent["type"] | undefined)
          : undefined;

      customResources.push({
        id: typeof resource.id === "number" ? resource.id : undefined,
        label,
        url,
        requiresLogin,
        ...(linkType ? { type: linkType } : {}),
      });
    }
  }

  return {
    id: typeof section.id === "number" ? section.id : index,
    title,
    description: typeof section.description === "string" ? section.description : null,
    ctaLabel: typeof section.ctaLabel === "string" ? section.ctaLabel : null,
    ctaUrl: typeof section.ctaUrl === "string" ? section.ctaUrl : null,
    type,
    tag: typeof section.tag === "string" ? section.tag : null,
    categoryName: typeof categoryAttributes?.name === "string" ? categoryAttributes.name : null,
    categorySlug: typeof categoryAttributes?.slug === "string" ? categoryAttributes.slug : null,
    image: imageAttributes
      ? {
          url: imageAttributes.url ?? undefined,
          alternativeText: imageAttributes.alternativeText ?? null,
        }
      : null,
    highlightedMediaItems: relationToArray<MediaItemEntity>(section.highlightedMediaItems),
    highlightedLessons: relationToArray<LessonEntity>(section.highlightedLessons),
    highlightedArticles: relationToArray<ArticleEntity>(section.highlightedArticles),
    highlightedCourses: relationToArray<CourseEntity>(section.highlightedCourses),
    highlightedBlogPosts: relationToArray<BlogPostEntity>(section.highlightedBlogPosts),
    customResources,
  };
}

export async function getResourceDirectory(): Promise<ResourceDirectory | null> {
  const params = new URLSearchParams();
  params.set("populate", "deep,4");

  try {
    const j = await getJSON<{ data: ResourceDirectoryEntity | null }>(`/api/resource-directory?${params.toString()}`, {
      tags: ["resource-directory"],
      revalidate: 180,
    });

    const entity = j.data;
    const attributes = entity?.attributes;
    if (!attributes) {
      return null;
    }

    const highlights = Array.isArray(attributes.highlights)
      ? attributes.highlights
          .map((entry, index) => mapHighlightEntry(entry, index))
          .filter((highlight): highlight is ResourceHighlight => Boolean(highlight))
      : [];

    const sections = Array.isArray(attributes.sections)
      ? attributes.sections
          .map((section, index) => mapSectionEntry(section, index))
          .filter((section): section is ResourceSection => Boolean(section))
      : [];

    const seo = attributes.seo
      ? {
          metaTitle: attributes.seo.metaTitle ?? null,
          metaDescription: attributes.seo.metaDescription ?? null,
          shareImageUrl: attributes.seo.shareImage?.data?.attributes?.url ?? null,
        }
      : null;

    return {
      id: typeof entity?.id === "number" ? entity.id : null,
      title: attributes.title ?? null,
      heroCopy: attributes.heroCopy ?? null,
      seo,
      highlights,
      sections,
      featuredMediaItems: relationToArray<MediaItemEntity>(attributes.featuredMediaItems),
      featuredLessons: relationToArray<LessonEntity>(attributes.featuredLessons),
      featuredArticles: relationToArray<ArticleEntity>(attributes.featuredArticles),
      featuredBlogPosts: relationToArray<BlogPostEntity>(attributes.featuredBlogPosts),
    };
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return null;
    }

    throw error;
  }
}

export async function getCommunityOutreachPage() {
  const params = new URLSearchParams();
  params.set("populate", "deep,4");

  try {
    const j = await getJSON<{ data: CommunityOutreachPageEntity | null }>(
      `/api/community-outreach-page?${params.toString()}`,
      {
        tags: ["community-outreach-page"],
        revalidate: 300,
      }
    );
    return j.data ?? null;
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return null;
    }

    throw error;
  }
}

type OutreachStoryQueryOptions = {
  limit?: number;
  featured?: boolean;
  includeDraft?: boolean;
  excludeIds?: number[];
  page?: number;
};

export async function getOutreachStories(options: OutreachStoryQueryOptions = {}) {
  const { limit = 6, featured, includeDraft = false, excludeIds, page } = options;
  const params = new URLSearchParams();
  params.set("sort[0]", "storyDate:desc");
  params.set("sort[1]", "publishedAt:desc");
  params.set("pagination[pageSize]", String(limit));
  params.set("populate", "deep,2");

  if (typeof page === "number" && Number.isFinite(page) && page > 0) {
    params.set("pagination[page]", String(page));
  }

  if (typeof featured === "boolean") {
    params.set("filters[featured][$eq]", featured ? "true" : "false");
  }

  if (Array.isArray(excludeIds) && excludeIds.length > 0) {
    excludeIds.forEach((id, index) => {
      params.set(`filters[id][$ne][${index}]`, String(id));
    });
  }

  const tags = ["outreach-stories", `outreach-stories:limit:${limit}`];
  if (typeof featured === "boolean") {
    tags.push(`outreach-stories:featured:${featured ? "1" : "0"}`);
  }
  if (includeDraft) {
    params.set("publicationState", "preview");
    tags.push("outreach-stories:draft");
  }

  try {
    const j = await getJSON<{ data: OutreachStoryEntity[] }>(`/api/outreach-stories?${params.toString()}`, {
      tags,
      revalidate: 300,
    });
    return j.data || [];
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return [] as OutreachStoryEntity[];
    }

    throw error;
  }
}

export async function getOutreachStoryBySlug(slug: string) {
  const params = new URLSearchParams();
  params.set("filters[slug][$eq]", slug);
  params.set("populate", "deep,3");
  params.set("pagination[pageSize]", "1");

  try {
    const j = await getJSON<{ data: OutreachStoryEntity[] }>(`/api/outreach-stories?${params.toString()}`, {
      tags: [`outreach-story:${slug}`],
      revalidate: 300,
    });
    return j.data?.[0] ?? null;
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return null;
    }

    throw error;
  }
}

export async function getOutreachStorySlugs(limit = 50) {
  const params = new URLSearchParams();
  params.set("fields[0]", "slug");
  params.set("pagination[pageSize]", String(limit));
  params.set("sort[0]", "publishedAt:desc");

  try {
    const j = await getJSON<{ data: OutreachStoryEntity[] }>(`/api/outreach-stories?${params.toString()}`, {
      tags: ["outreach-stories:slugs"],
      revalidate: 300,
    });
    return (j.data || [])
      .map((entity) => entity?.attributes?.slug)
      .filter((slug): slug is string => typeof slug === "string" && slug.trim().length > 0);
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return [] as string[];
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
    if (isNotFoundOrNetwork(error)) {
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
      if (isNotFoundOrNetwork(error)) {
        continue;
      }

      throw error;
    }
  }

  return null as ConferencePageEntity | null;
}

export type SeriesEntity = {
  id: number;
  attributes?: {
    title?: string;
    slug?: string;
    description?: string | null;
    coverImage?: {
      data?: {
        attributes?: {
          url?: string;
          alternativeText?: string | null;
        } | null;
      } | null;
    } | null;
    mediaItems?: {
      data?: MediaItemEntity[];
    };
  };
};

export async function getAllSeries() {
  const params = new URLSearchParams();
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "description");
  params.set("populate[coverImage][fields][0]", "url");
  params.set("populate[coverImage][fields][1]", "alternativeText");
  params.set("populate[mediaItems][count]", "true");
  params.set("sort[0]", "createdAt:desc");
  params.set("pagination[pageSize]", "100");

  try {
    const j = await getJSON<{ data: SeriesEntity[] }>(`/api/series-collection?${params.toString()}`, {
      tags: ["series"],
      revalidate: 300,
    });
    return j.data || [];
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return [] as SeriesEntity[];
    }

    throw error;
  }
}

export async function getSeriesBySlug(slug: string) {
  const params = new URLSearchParams();
  params.set("filters[slug][$eq]", slug);
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "description");
  params.set("populate[coverImage][fields][0]", "url");
  params.set("populate[coverImage][fields][1]", "alternativeText");
  params.set("populate[mediaItems][fields][0]", "title");
  params.set("populate[mediaItems][fields][1]", "slug");
  params.set("populate[mediaItems][fields][2]", "excerpt");
  params.set("populate[mediaItems][fields][3]", "releasedAt");
  params.set("populate[mediaItems][fields][4]", "weekNumber");
  params.set("populate[mediaItems][fields][5]", "episodeNumber");
  params.set("populate[mediaItems][populate][thumbnail][fields][0]", "url");
  params.set("populate[mediaItems][populate][thumbnail][fields][1]", "alternativeText");
  params.set("populate[mediaItems][populate][speakers][fields][0]", "name");
  params.set("populate[mediaItems][populate][speakers][fields][1]", "displayName");
  params.set("populate[mediaItems][sort][0]", "weekNumber:asc");
  params.set("populate[mediaItems][sort][1]", "episodeNumber:asc");
  params.set("populate[mediaItems][sort][2]", "releasedAt:asc");
  params.set("pagination[pageSize]", "1");

  try {
    const j = await getJSON<{ data: SeriesEntity[] }>(`/api/series-collection?${params.toString()}`, {
      tags: [`series:${slug}`],
      revalidate: 300,
    });
    return j.data?.[0] ?? null;
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return null;
    }

    throw error;
  }
}

// ------------------------------
// Scripture API Functions
// ------------------------------

type ScriptureWorksOptions = {
  testament?: 'tanakh' | 'renewed_covenant' | 'apocrypha';
};

export async function getScriptureWorks(options: ScriptureWorksOptions = {}) {
  const params = new URLSearchParams();
  params.set("fields[0]", "workId");
  params.set("fields[1]", "canonicalName");
  params.set("fields[2]", "translatedTitle");
  params.set("fields[3]", "shortCode");
  params.set("fields[4]", "testament");
  params.set("fields[5]", "canonicalOrder");
  params.set("fields[6]", "totalChapters");
  params.set("fields[7]", "totalVerses");
  params.set("fields[8]", "author");
  params.set("fields[9]", "genre");
  params.set("fields[10]", "summary");
  params.set("fields[11]", "hebrewName");
  params.set("fields[12]", "greekName");
  params.set("sort[0]", "canonicalOrder:asc");
  params.set("pagination[pageSize]", "100");

  if (options.testament) {
    params.set("filters[testament][$eq]", options.testament);
  }

  try {
    const j = await getJSON<{ data: ScriptureWorkEntity[] }>(
      `/api/scripture-works?${params.toString()}`,
      {
        tags: ["scripture-works"],
        revalidate: 3600, // Cache for 1 hour
      }
    );
    return (j.data || []).map(work => ({
      documentId: work.documentId as string,
      ...work.attributes,
    }));
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return [];
    }

    throw error;
  }
}

export async function getScriptureWorkBySlug(slug: string) {
  const params = new URLSearchParams();
  params.set("filters[workId][$eqi]", slug); // Match by workId instead of shortCode
  params.set("fields[0]", "workId");
  params.set("fields[1]", "canonicalName");
  params.set("fields[2]", "translatedTitle");
  params.set("fields[3]", "shortCode");
  params.set("fields[4]", "testament");
  params.set("fields[5]", "canonicalOrder");
  params.set("fields[6]", "totalChapters");
  params.set("fields[7]", "totalVerses");
  params.set("fields[8]", "author");
  params.set("fields[9]", "estimatedDate");
  params.set("fields[10]", "genre");
  params.set("fields[11]", "summary");
  params.set("fields[12]", "hebrewName");
  params.set("fields[13]", "greekName");
  params.set("pagination[pageSize]", "1");

  try {
    const j = await getJSON<{ data: ScriptureWorkEntity[] }>(
      `/api/scripture-works?${params.toString()}`,
      {
        tags: [`scripture-work:${slug.toLowerCase()}`],
        revalidate: 3600,
      }
    );
    const work = j.data?.[0];
    return work ? { documentId: work.documentId as string, ...work.attributes } : null;
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return null;
    }

    throw error;
  }
}

export async function getScriptureVerses(workId: string, chapter: number) {
  const params = new URLSearchParams();
  params.set("filters[work][workId][$eq]", workId);
  params.set("filters[chapter][$eq]", String(chapter));
  params.set("fields[0]", "verseId");
  params.set("fields[1]", "chapter");
  params.set("fields[2]", "verse");
  params.set("fields[3]", "text");
  params.set("fields[4]", "paleoHebrewDivineNames");
  params.set("fields[5]", "hasFootnotes");
  params.set("populate[footnotes]", "*");
  params.set("populate[work][fields][0]", "workId");
  params.set("populate[work][fields][1]", "canonicalName");
  params.set("populate[work][fields][2]", "shortCode");
  params.set("sort[0]", "verse:asc");
  params.set("pagination[pageSize]", "200"); // Max verses per chapter

  try {
    const j = await getJSON<{ data: ScriptureVerseEntity[] }>(
      `/api/scripture-verses?${params.toString()}`,
      {
        tags: [`verses:${workId}:${chapter}`],
        revalidate: 3600,
      }
    );
    return (j.data || []).map(verse => ({
      documentId: verse.documentId as string,
      ...verse.attributes,
    }));
  } catch (error) {
    if (isNotFoundOrNetwork(error)) {
      return [];
    }

    throw error;
  }
}
