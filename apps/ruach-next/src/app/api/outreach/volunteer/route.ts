import { NextRequest, NextResponse } from "next/server";
import {
  ipFromHeaders,
  volunteerLimiter,
  requireRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/ratelimit";
import { env } from "@/lib/env";

const STRAPI = env.NEXT_PUBLIC_STRAPI_URL;
const API_TOKEN = env.STRAPI_VOLUNTEER_TOKEN ?? env.STRAPI_API_TOKEN;
const COLLECTION = env.STRAPI_VOLUNTEER_COLLECTION ?? "volunteer-signups";

export async function POST(req: NextRequest) {
  if (!API_TOKEN) {
    return NextResponse.json({ error: "Volunteer collection not configured." }, { status: 500 });
  }

  const ip = ipFromHeaders(req.headers);
  try {
    await requireRateLimit(volunteerLimiter, ip, "Too many submissions. Please try again soon.");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    throw error;
  }

  const { name, email, phone, availability, message } = await req.json().catch(() => ({}));
  if (!email || !name) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const payload = {
    data: {
      name,
      email,
      phone,
      availability,
      message
    }
  };

  const res = await fetch(`${STRAPI}/api/${COLLECTION}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`
    },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to submit volunteer form", details: json }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
