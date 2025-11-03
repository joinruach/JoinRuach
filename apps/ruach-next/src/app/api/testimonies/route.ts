import { NextRequest, NextResponse } from "next/server";
import {
  ipFromHeaders,
  testimonyLimiter,
  requireRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/ratelimit";
import { env } from "@/lib/env";

const STRAPI = env.NEXT_PUBLIC_STRAPI_URL;
const API_TOKEN = env.STRAPI_TESTIMONY_TOKEN ?? env.STRAPI_API_TOKEN;
const COLLECTION = env.STRAPI_TESTIMONY_COLLECTION ?? "testimonies";

export async function POST(req: NextRequest) {
  if (!API_TOKEN) {
    return NextResponse.json({ error: "Testimony form not configured." }, { status: 500 });
  }

  const ip = ipFromHeaders(req.headers);
  try {
    await requireRateLimit(testimonyLimiter, ip, "Too many testimony submissions. Please try again later.");
  } catch (error) {
    if (error instanceof RateLimitError) {
      return rateLimitResponse(error);
    }
    throw error;
  }

  const body = await req.json().catch(() => ({}));

  // Validate required fields
  if (!body.name || !body.email || !body.story_before || !body.story_encounter || !body.story_after) {
    return NextResponse.json(
      { error: "Name, email, and all three story sections are required." },
      { status: 400 }
    );
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  // Prepare payload for Strapi
  const payload = {
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      location: body.location || null,
      ageRange: body.ageRange || null,
      socialHandles: body.socialHandles || null,
      story_before: body.story_before,
      story_encounter: body.story_encounter,
      story_after: body.story_after,
      scripture_anchor: body.scripture_anchor || null,
      core_message: body.core_message || null,
      on_camera: !!body.on_camera,
      media_consent: !!body.media_consent,
      referral_source: body.referral_source || null,
      join_future_projects: !!body.join_future_projects,
      prayer_request: body.prayer_request || null,
      contact_preference: body.contact_preference || null,
    }
  };

  const res = await fetch(`${STRAPI}/api/${COLLECTION}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`
    },
    body: JSON.stringify(payload.data)
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to submit testimony", details: json },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Testimony submitted successfully" });
}
