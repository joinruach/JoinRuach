import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { moderateLimiter, requireRateLimit, rateLimitResponse, RateLimitError } from "@/lib/ratelimit";
import { isModerator } from "@/lib/strapi-user";
const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }){
  try {
    const session = await auth();
    const jwt = session?.strapiJwt;
    const email = session?.user?.email;

    if (!jwt || !email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has moderator role
    const isUserModerator = await isModerator(jwt);
    if (!isUserModerator) {
      return NextResponse.json({ error: "Forbidden - Moderator role required" }, { status: 403 });
    }

    // Rate limit by moderator email
    await requireRateLimit(moderateLimiter, email, "Too many moderation actions");

    const { id } = await context.params;
    const r = await fetch(`${STRAPI}/api/lesson-comments/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ data: { approved: true } }), cache: "no-store"
    });
    const j = await r.json().catch(()=>({}));
    if (!r.ok) return NextResponse.json({ error: "Approve failed", details: j }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    throw error;
  }
}
