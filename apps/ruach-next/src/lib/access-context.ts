"use server";

// Added helper functions to fetch owned course data
import { auth } from "@/lib/auth";
import { fetchStrapiMembership, STRAPI_API_URL } from "@/lib/strapi-membership";
import { ViewerAccess, normalizeAccessLevel } from "@ruach/utils";

type OwnedCourseMeta = {
  slugs: string[];
  courseIds: string[];
};

async function fetchCourseIdsForSlugs(jwt: string, slugs: string[]): Promise<string[]> {
  if (!slugs.length) {
    return [];
  }

  const params = new URLSearchParams({
    "filters[slug][$in]": slugs.join(","),
    "fields[0]": "slug",
    "fields[1]": "courseId",
    "pagination[pageSize]": String(slugs.length),
  });

  const res = await fetch(`${STRAPI_API_URL}/api/courses?${params.toString()}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  const slugMap = new Map<string, string>();

  for (const entry of data) {
    const slug = entry?.attributes?.slug;
    const courseId = entry?.attributes?.courseId;
    if (typeof slug === "string" && typeof courseId === "string") {
      slugMap.set(slug, courseId);
    }
  }

  return slugs
    .map((slug) => slugMap.get(slug))
    .filter((courseId): courseId is string => Boolean(courseId));
}

async function fetchOwnedCourseMeta(jwt: string, userId: number): Promise<OwnedCourseMeta> {
  const params = new URLSearchParams({
    "filters[user][id][$eq]": String(userId),
    "fields[0]": "courseSlug",
    "pagination[pageSize]": "200",
  });

  const res = await fetch(`${STRAPI_API_URL}/api/course-licenses?${params.toString()}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return { slugs: [], courseIds: [] };
  }

  const json = await res.json();
  const licenses = Array.isArray(json?.data) ? json.data : [];
  const slugs = Array.from(
    new Set(
      licenses
        .map((entry) => entry?.attributes?.courseSlug)
        .filter((slug): slug is string => typeof slug === "string" && Boolean(slug))
    )
  );

  if (!slugs.length) {
    return { slugs, courseIds: [] };
  }

  const courseIds = await fetchCourseIdsForSlugs(jwt, slugs);
  return { slugs, courseIds };
}

interface ExtendedSession {
  strapiJwt?: string;
  [key: string]: unknown;
}

export type ViewerAccessContext = {
  viewer: ViewerAccess | null;
  ownedCourseSlugs: string[];
  ownedCourseIds: string[];
  jwt: string | null;
};

export async function getViewerAccessContext(
  existingJwt?: string
): Promise<ViewerAccessContext> {
  let jwt = existingJwt ?? null;
  if (!jwt) {
    const session = await auth();
    jwt = (session as ExtendedSession | null)?.strapiJwt ?? null;
  }

  if (!jwt) {
    return { viewer: null, ownedCourseSlugs: [], ownedCourseIds: [], jwt: null };
  }

  const membership = await fetchStrapiMembership(jwt);
  const viewer: ViewerAccess | null = membership
    ? {
        accessLevel: normalizeAccessLevel(membership.accessLevel ?? null),
        membershipTier: normalizeAccessLevel(membership.membershipTier ?? null),
        membershipStatus: membership.membershipStatus ?? null,
        membershipCurrentPeriodEnd: membership.membershipCurrentPeriodEnd ?? null,
      }
    : null;

  const ownedCourses =
    typeof membership?.id === "number" ? await fetchOwnedCourseMeta(jwt, membership.id) : { slugs: [], courseIds: [] };

  return {
    viewer,
    ownedCourseSlugs: ownedCourses.slugs,
    ownedCourseIds: ownedCourses.courseIds,
    jwt,
  };
}
