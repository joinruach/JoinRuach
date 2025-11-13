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

// Request body types
interface ContactRequestBody {
  name: string;
  email: string;
  topic?: string;
  message: string;
}

// Response types
interface ContactSuccessResponse {
  ok: true;
}

interface ContactErrorResponse {
  error: string;
  details?: unknown;
}

// Assertion function for request body
function assertContactBody(body: unknown): asserts body is ContactRequestBody {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const b = body as Partial<ContactRequestBody>;

  if (!b.name || typeof b.name !== 'string' || b.name.trim().length === 0) {
    throw new Error('Name is required');
  }

  if (!b.email || typeof b.email !== 'string' || !b.email.includes('@')) {
    throw new Error('Valid email is required');
  }

  if (!b.message || typeof b.message !== 'string' || b.message.trim().length === 0) {
    throw new Error('Message is required');
  }

  if (b.topic !== undefined && typeof b.topic !== 'string') {
    throw new Error('Topic must be a string');
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ContactSuccessResponse | ContactErrorResponse>> {
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
    assertContactBody(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    );
  }

  const { name, email, topic, message } = body;

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

  let json: unknown;
  try {
    json = await res.json();
  } catch (error) {
    console.error('Failed to parse Strapi response:', error);
    if (!res.ok) {
      return NextResponse.json({ error: "Could not send message" }, { status: 500 });
    }
    // If response was OK but JSON parsing failed, still return success
    return NextResponse.json({ ok: true });
  }

  if (!res.ok) {
    return NextResponse.json({ error: "Could not send message", details: json }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
