import type { CourseProgressApiResponse } from "@/lib/api/courseProgress";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

export async function fetchCourseProgressFromStrapi(
  slug: string,
  jwt: string
): Promise<CourseProgressApiResponse> {
  const res = await fetch(`${STRAPI}/api/courses/${slug}/progress`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to fetch course progress (${res.status}): ${body}`);
  }

  const payload = (await res.json()) as CourseProgressApiResponse;
  if (!payload || !payload.courseSlug) {
    throw new Error("Invalid course progress response");
  }

  return payload;
}
