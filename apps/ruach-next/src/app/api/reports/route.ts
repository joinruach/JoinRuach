import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ipFromHeaders,
  reportsLimiter,
  requireRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/ratelimit";
import { env } from "@/lib/env";

const STRAPI = env.NEXT_PUBLIC_STRAPI_URL;

// Extended session type with Strapi JWT
interface ExtendedSession {
  strapiJwt?: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest){
  const ip = ipFromHeaders(req.headers);
  try {
    await requireRateLimit(reportsLimiter, ip, "Too many reports. Try later.");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    throw error;
  }

  const session = await getServerSession(authOptions as AuthOptions);
  const jwt = (session as ExtendedSession | null)?.strapiJwt;
  if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { commentId?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { commentId, reason } = body;
  if (!commentId) return NextResponse.json({ error: "Missing commentId" }, { status: 400 });

  const r = await fetch(`${STRAPI}/api/comment-reports`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ data: { commentId, reason: reason ?? "" } })
  });

  let j: { data?: { id?: unknown } } | undefined;
  try {
    j = await r.json();
  } catch {
    // JSON parsing failed
  }

  if (!r.ok) return NextResponse.json({ error: "Create failed", details: j }, { status: 500 });

  return NextResponse.json({ ok: true, id: j?.data?.id });
}
