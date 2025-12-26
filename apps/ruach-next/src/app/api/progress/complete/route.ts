import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { progressLimiter, requireRateLimit, rateLimitResponse, RateLimitError } from "@/lib/ratelimit";
const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

// Extended session type with Strapi JWT
interface ExtendedSession {
  strapiJwt?: string;
  user?: {
    email?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export async function POST(req: NextRequest){
  try {
    const session = await auth();
    const jwt = (session as ExtendedSession | null)?.strapiJwt;
    if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit by user email
    const email = (session as ExtendedSession | null)?.user?.email;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireRateLimit(progressLimiter, email, "Too many progress updates");

    let body: { courseSlug?: unknown; lessonSlug?: unknown; secondsWatched?: unknown; completed?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { courseSlug, lessonSlug, secondsWatched, completed } = body;
    if (!courseSlug || !lessonSlug) return NextResponse.json({ error: "Missing slugs" }, { status: 400 });

    const r = await fetch(`${STRAPI}/api/lesson-progresses`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ data: { courseSlug, lessonSlug, secondsWatched: secondsWatched||0, completed: !!completed } })
    });

    let responseData: unknown;
    try {
      responseData = await r.json();
    } catch {
      // JSON parsing failed
    }

    if (!r.ok) {
      return NextResponse.json({ error: "Save failed", details: responseData }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    throw error;
  }
}
