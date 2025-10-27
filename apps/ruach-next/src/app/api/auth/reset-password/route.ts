import { NextRequest, NextResponse } from "next/server";
import {
  ipFromHeaders,
  RateLimitError,
  rateLimitResponse,
  requireRateLimit,
  resetPasswordLimiter,
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
      resetPasswordLimiter,
      ip,
      "Too many reset attempts. Try again later."
    );
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    throw error;
  }

  const { code, password, passwordConfirmation } = await req.json().catch(() => ({}));

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Reset code required" }, { status: 400 });
  }

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  if (password !== passwordConfirmation) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const baseUrl =
    normalizeBaseUrl(env.NEXT_PUBLIC_STRAPI_URL) ?? normalizeBaseUrl(process.env.STRAPI_URL);

  if (!baseUrl) {
    return NextResponse.json({ error: "Strapi URL not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, password, passwordConfirmation }),
    });

    const raw = await res.text();

    if (!res.ok) {
      let message = "Unable to reset password";
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Network error communicating with Strapi" },
      { status: 502 }
    );
  }
}
