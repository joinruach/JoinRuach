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

// Request body types
interface TestimonyRequestBody {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  ageRange?: string;
  socialHandles?: string;
  story_before: string;
  story_encounter: string;
  story_after: string;
  scripture_anchor?: string;
  core_message?: string;
  on_camera?: boolean;
  media_consent?: boolean;
  referral_source?: string;
  join_future_projects?: boolean;
  prayer_request?: string;
  contact_preference?: string;
}

// Response types
interface TestimonySuccessResponse {
  ok: true;
  message: string;
}

interface TestimonyErrorResponse {
  error: string;
  details?: unknown;
}

// Assertion function for request body
function assertTestimonyBody(body: unknown): asserts body is TestimonyRequestBody {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const b = body as Partial<TestimonyRequestBody>;

  // Required fields
  if (!b.name || typeof b.name !== 'string' || b.name.trim().length === 0) {
    throw new Error('Name is required');
  }

  if (!b.email || typeof b.email !== 'string') {
    throw new Error('Email is required');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(b.email)) {
    throw new Error('Invalid email address');
  }

  if (!b.story_before || typeof b.story_before !== 'string' || b.story_before.trim().length === 0) {
    throw new Error('Story before encounter is required');
  }

  if (!b.story_encounter || typeof b.story_encounter !== 'string' || b.story_encounter.trim().length === 0) {
    throw new Error('Story of encounter is required');
  }

  if (!b.story_after || typeof b.story_after !== 'string' || b.story_after.trim().length === 0) {
    throw new Error('Story after encounter is required');
  }

  // Optional string fields
  const optionalStringFields: Array<keyof TestimonyRequestBody> = [
    'phone', 'location', 'ageRange', 'socialHandles', 'scripture_anchor',
    'core_message', 'referral_source', 'prayer_request', 'contact_preference'
  ];

  for (const field of optionalStringFields) {
    if (b[field] !== undefined && typeof b[field] !== 'string') {
      throw new Error(`${field} must be a string`);
    }
  }

  // Boolean fields
  const booleanFields: Array<keyof TestimonyRequestBody> = [
    'on_camera', 'media_consent', 'join_future_projects'
  ];

  for (const field of booleanFields) {
    if (b[field] !== undefined && typeof b[field] !== 'boolean') {
      throw new Error(`${field} must be a boolean`);
    }
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<TestimonySuccessResponse | TestimonyErrorResponse>> {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  try {
    assertTestimonyBody(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    );
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

  let json: unknown;
  try {
    json = await res.json();
  } catch (error) {
    console.error('Failed to parse Strapi response:', error);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to submit testimony" },
        { status: 500 }
      );
    }
    // If response was OK but JSON parsing failed, still return success
    return NextResponse.json({ ok: true, message: "Testimony submitted successfully" });
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to submit testimony", details: json },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Testimony submitted successfully" });
}
