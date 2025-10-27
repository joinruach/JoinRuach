import { NextRequest, NextResponse } from "next/server";
import {
  resendLimiter,
  ipFromHeaders,
  requireRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/ratelimit";
import { env } from "@/lib/env";

function normalizeBaseUrl(value?: string | null) {
  if (!value || typeof value !== "string") return undefined;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export async function POST(req: NextRequest) {
  const ip = ipFromHeaders(req.headers);
  try {
    await requireRateLimit(resendLimiter, ip, "Too many resend requests. Try again later.");
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
    normalizeBaseUrl(env.NEXT_PUBLIC_STRAPI_URL) ??
    normalizeBaseUrl(process.env.STRAPI_URL);

  if (!baseUrl) {
    return NextResponse.json(
      { error: "Strapi URL not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${baseUrl}/api/auth/send-email-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Strapi only accepts the email field; redirect URL comes from backend config.
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Strapi error ${res.status}${text ? `: ${text}` : ""}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Confirmation email resent if the account exists.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Network error communicating with Strapi" },
      { status: 502 }
    );
  }
}
