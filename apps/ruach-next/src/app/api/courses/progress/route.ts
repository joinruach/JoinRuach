import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchCourseProgressFromStrapi } from "@/app/api/courses/progress/utils";
import type { CourseProgressApiResponse } from "@/lib/api/courseProgress";

export async function GET(req: Request) {
  const session = await auth();
  const jwt = (session as { strapiJwt?: string } | null)?.strapiJwt;
  if (!jwt) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const slugsParam = url.searchParams.get("slugs");
  if (!slugsParam) {
    return NextResponse.json({ error: "Missing slugs parameter" }, { status: 400 });
  }

  const slugs = Array.from(
    new Set(
      slugsParam
        .split(",")
        .map((slug) => slug.trim())
        .filter((slug): slug is string => slug.length > 0)
    )
  );

  if (!slugs.length) {
    return NextResponse.json({ error: "No valid slugs provided" }, { status: 400 });
  }

  const entries = await Promise.all(
    slugs.map(async (slug) => {
      try {
        return await fetchCourseProgressFromStrapi(slug, jwt);
      } catch {
        return null;
      }
    })
  );

  const payload: Record<string, CourseProgressApiResponse> = {};
  for (const entry of entries) {
    if (entry) {
      payload[entry.courseSlug] = entry;
    }
  }

  return NextResponse.json(payload);
}
