import { NextRequest, NextResponse } from "next/server";
import {
  signupLimiter,
  ipFromHeaders,
  requireRateLimit,
  rateLimitResponse,
  RateLimitError,
} from "@/lib/ratelimit";
import { env } from "@/lib/env";

const STRAPI = env.NEXT_PUBLIC_STRAPI_URL;

export async function POST(req: NextRequest){
  const ip = ipFromHeaders(req.headers);
  try {
    await requireRateLimit(signupLimiter, ip, "Too many signups. Try later.");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    throw error;
  }

  const { email, password, username } = await req.json().catch(()=>({}));
  if (!email || !password) return NextResponse.json({ error: "Missing email/password" }, { status: 400 });

  const r = await fetch(`${STRAPI}/api/auth/local/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username: username || email, password })
  });
  const j = await r.json().catch(()=>({}));

  if (!r.ok) return NextResponse.json({ error: j?.error?.message || "Signup failed" }, { status: 400 });
  // Trigger confirmation email by updating email confirmation settings in Strapi.
  return NextResponse.json({ ok: true });
}
