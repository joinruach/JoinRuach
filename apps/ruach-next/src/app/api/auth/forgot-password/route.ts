import { NextRequest, NextResponse } from "next/server";
import {
  forgotPasswordLimiter,
  ipFromHeaders,
  RateLimitError,
  rateLimitResponse,
  requireRateLimit,
} from "@/lib/ratelimit";
import { env } from "@/lib/env";

function normalizeBaseUrl(value?: string | null) {
  if (!value || typeof value !== "string") return undefined;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export async function POST(req: NextRequest) {
  const ip = ipFromHeaders(req.headers);

  try {
    await requireRateLimit(
      forgotPasswordLimiter,
      ip,
      "Too many password reset requests. Try again later."
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    throw error;
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const baseUrl =
    normalizeBaseUrl(env.NEXT_PUBLIC_STRAPI_URL) ?? normalizeBaseUrl(process.env.STRAPI_URL);

  if (!baseUrl) {
    return NextResponse.json({ error: "Strapi URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const raw = await res.text();

    if (!res.ok) {
      let message = "Unable to send reset email";
      if (raw) {
        try {
          const data = JSON.parse(raw);
          message = data?.error?.message || data?.message || message;
        } catch {
          message = `${message}: ${raw}`;
        }
      }
      const status = res.status >= 400 && res.status < 500 ? res.status : 502;
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({
      ok: true,
      message: "If an account exists, a password reset email has been sent.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Network error communicating with Strapi" },
      { status: 502 }
    );
  }
}
