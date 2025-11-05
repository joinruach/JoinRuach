import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { moderateLimiter, requireRateLimit, rateLimitResponse, RateLimitError } from "@/lib/ratelimit";
import { isModerator } from "@/lib/strapi-user";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }){
  try {
    const session = await getServerSession(authOptions);
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
    const res = await fetch(`${STRAPI}/api/lesson-comments/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`
      },
      cache: "no-store"
    });

    if (!res.ok) {
      const details = await res.json().catch(() => ({}));
      return NextResponse.json({ error: "Reject failed", details }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    throw error;
  }
}
