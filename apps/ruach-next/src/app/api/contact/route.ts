import { NextRequest, NextResponse } from "next/server";
import {
  contactLimiter,
  ipFromHeaders,
  requireRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/ratelimit";
import { env } from "@/lib/env";

const STRAPI = env.NEXT_PUBLIC_STRAPI_URL;
const API_TOKEN = env.STRAPI_CONTACT_TOKEN ?? env.STRAPI_API_TOKEN;
const COLLECTION = env.STRAPI_CONTACT_COLLECTION ?? "contact-submissions";

export async function POST(req: NextRequest) {
  if (!API_TOKEN) {
    return NextResponse.json({ error: "Contact form not configured." }, { status: 500 });
  }

  const ip = ipFromHeaders(req.headers);
  try {
    await requireRateLimit(contactLimiter, ip, "Slow down. Please try again soon.");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    throw error;
  }

  const { name, email, topic, message } = await req.json().catch(() => ({}));
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }

  const payload = {
    data: {
      name,
      email,
      topic,
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
    return NextResponse.json({ error: "Could not send message", details: json }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
