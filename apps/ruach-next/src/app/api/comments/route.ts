import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { commentsGetLimiter, commentsPostLimiter, ipFromHeaders, requireRateLimit, rateLimitResponse, RateLimitError } from "@/lib/ratelimit";
import { isModerator } from "@/lib/strapi-user";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

// GET /api/comments?courseSlug=...&lessonSlug=...
export async function GET(req: NextRequest){
  try {
    // Rate limit by IP
    const ipAddress = ipFromHeaders(req.headers);
    await requireRateLimit(commentsGetLimiter, ipAddress, "Too many comment requests");

    const { searchParams } = new URL(req.url);
    const courseSlug = searchParams.get("courseSlug");
    const lessonSlug = searchParams.get("lessonSlug");
    if (!courseSlug || !lessonSlug) return NextResponse.json({ error: "Missing slugs" }, { status: 400 });

    const qs = new URLSearchParams({
      "filters[courseSlug][$eq]": courseSlug,
      "filters[lessonSlug][$eq]": lessonSlug,
      "filters[approved][$eq]": "true",
      "sort[0]": "createdAt:desc",
      "pagination[pageSize]": "50",
      "populate": "user"
    }).toString();

    const r = await fetch(`${STRAPI}/api/lesson-comments?${qs}`, { cache: "no-store" });

    let j: unknown;
    try {
      j = await r.json();
    } catch (error) {
      console.error('Failed to parse Strapi response:', error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    if (!r.ok) {
      return NextResponse.json(
        { error: "Fetch failed", details: j },
        { status: 500 }
      );
    }

    interface CommentData {
      id: number;
      attributes?: {
        text?: string;
        createdAt?: string;
        user?: {
          data?: {
            attributes?: {
              username?: string;
              email?: string;
            };
          };
        };
      };
    }

    interface StrapiCommentsResponse {
      data?: CommentData[];
    }

    const response = j as StrapiCommentsResponse;
    const comments = (response.data ?? []).map((row) => ({
      id: row.id,
      author: row.attributes?.user?.data?.attributes?.username ||
              row.attributes?.user?.data?.attributes?.email ||
              "User",
      text: row.attributes?.text || "",
      createdAt: row.attributes?.createdAt || new Date().toISOString()
    }));

    return NextResponse.json({ comments });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    throw error;
  }
}

// POST /api/comments { courseSlug, lessonSlug, text }
export async function POST(req: NextRequest){
  try {
    const session = await getServerSession(authOptions);
    const jwt = session?.strapiJwt;
    if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit by user email
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await requireRateLimit(commentsPostLimiter, email, "Too many comments posted");

    interface CommentRequestBody {
      courseSlug: string;
      lessonSlug: string;
      text: string;
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { courseSlug, lessonSlug, text } = body as Partial<CommentRequestBody>;
    if (!courseSlug || !lessonSlug || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if user has moderator role for auto-approval
    const isUserModerator = await isModerator(jwt);

    const r = await fetch(`${STRAPI}/api/lesson-comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`
      },
      body: JSON.stringify({
        data: {
          courseSlug,
          lessonSlug,
          text,
          approved: isUserModerator
        }
      })
    });

    interface CreateCommentResponse {
      data?: {
        id?: number;
      };
    }

    let j: unknown;
    try {
      j = await r.json();
    } catch (error) {
      console.error('Failed to parse Strapi response:', error);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    if (!r.ok) {
      return NextResponse.json(
        { error: "Create failed", details: j },
        { status: 500 }
      );
    }

    const response = j as CreateCommentResponse;
    return NextResponse.json({
      ok: true,
      id: response.data?.id,
      approved: isUserModerator
    });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    throw error;
  }
}
