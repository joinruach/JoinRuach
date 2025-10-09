import { NextRequest, NextResponse } from "next/server";
import {
  ipFromHeaders,
  newsletterLimiter,
  requireRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/ratelimit";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  const ip = ipFromHeaders(req.headers);
  try {
    await requireRateLimit(newsletterLimiter, ip, "Too many signups. Please try again later.");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    throw error;
  }

  const { email, firstName, tags } = await req.json().catch(() => ({}));

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 }
    );
  }

  if (!env.CONVERTKIT_API_SECRET || !env.NEXT_PUBLIC_CONVERTKIT_FORM_ID) {
    return NextResponse.json({
      ok: true,
      message:
        "Thanks for joining! Our team will add you manually while we finish newsletter setup.",
    });
  }

  const payload: Record<string, unknown> = {
    api_secret: env.CONVERTKIT_API_SECRET,
    email,
  };

  if (env.NEXT_PUBLIC_CONVERTKIT_API_KEY) {
    payload.api_key = env.NEXT_PUBLIC_CONVERTKIT_API_KEY;
  }
  if (firstName && typeof firstName === "string") payload.first_name = firstName;
  if (Array.isArray(tags)) payload.tags = tags.filter((tag) => typeof tag === "number" || typeof tag === "string");

  const response = await fetch(
    `https://api.convertkit.com/v3/forms/${env.NEXT_PUBLIC_CONVERTKIT_FORM_ID}/subscribe`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const json = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      (json as { message?: string; error?: string })?.message ||
      (json as { message?: string; error?: string })?.error ||
      "Unable to subscribe.";

    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
