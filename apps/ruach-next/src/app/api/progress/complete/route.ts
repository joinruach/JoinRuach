import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { progressLimiter, requireRateLimit, rateLimitResponse, RateLimitError } from "@/lib/ratelimit";
const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

export async function POST(req: NextRequest){
  try {
    const session = await getServerSession(authOptions as any) as Session | null;
    const jwt = session?.strapiJwt as string | undefined;
    if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit by user email
    const email = session?.user?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireRateLimit(progressLimiter, email, "Too many progress updates");

    const { courseSlug, lessonSlug, secondsWatched, completed } = await req.json().catch(()=>({}));
    if (!courseSlug || !lessonSlug) return NextResponse.json({ error: "Missing slugs" }, { status: 400 });

    const r = await fetch(`${STRAPI}/api/lesson-progresses`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ data: { courseSlug, lessonSlug, secondsWatched: secondsWatched||0, completed: !!completed } })
    });
    const j = await r.json().catch(()=>({}));
    if (!r.ok) return NextResponse.json({ error: "Save failed", details: j }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    throw error;
  }
}
