import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchCourseProgressFromStrapi } from "@/app/api/courses/progress/utils";

export async function GET(req: Request, { params }: { params: { slug?: string } }) {
  const session = await auth();
  const jwt = (session as { strapiJwt?: string } | null)?.strapiJwt;
  if (!jwt) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = params.slug;
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const progress = await fetchCourseProgressFromStrapi(slug, jwt);
    return NextResponse.json(progress);
  } catch (error) {
    console.error("[Course Progress] Failed to load slug", slug, error);
    return NextResponse.json(
      { error: "Failed to load course progress" },
      { status: 502 }
    );
  }
}
