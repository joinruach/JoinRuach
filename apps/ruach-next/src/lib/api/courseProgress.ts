const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

export type CourseProgressApiResponse = {
  courseSlug: string;
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
};

async function fetchCourseProgress(
  courseSlug: string,
  jwt: string | undefined
): Promise<CourseProgressApiResponse | null> {
  if (!jwt) {
    return null;
  }

  try {
    const res = await fetch(`${STRAPI}/api/courses/${courseSlug}/progress`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return null;
    }
    const payload = (await res.json()) as CourseProgressApiResponse;
    if (!payload || !payload.courseSlug) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getCourseProgress(
  courseSlug: string,
  jwt: string | undefined
): Promise<CourseProgressApiResponse | null> {
  return fetchCourseProgress(courseSlug, jwt);
}

export async function getCourseProgressMap(
  courseSlugs: string[],
  jwt: string | undefined
): Promise<Map<string, CourseProgressApiResponse>> {
  const unique = Array.from(new Set(courseSlugs));
  if (!unique.length || !jwt) {
    return new Map();
  }

  const entries = await Promise.all(unique.map((slug) => fetchCourseProgress(slug, jwt)));
  const map = new Map<string, CourseProgressApiResponse>();
  for (const entry of entries) {
    if (entry) {
      map.set(entry.courseSlug, entry);
    }
  }
  return map;
}

export async function getCourseProgressProxy(
  courseSlug: string
): Promise<CourseProgressApiResponse | null> {
  try {
    const res = await fetch(`/api/courses/${courseSlug}/progress`, {
      credentials: "include",
    });
    if (!res.ok) {
      return null;
    }
    const payload = (await res.json()) as CourseProgressApiResponse;
    if (!payload || !payload.courseSlug) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
