import { NextRequest, NextResponse } from "next/server";
import {
  ipFromHeaders,
  newsletterLimiter,
  requireRateLimit,
  RateLimitError,
  rateLimitResponse,
} from "@/lib/ratelimit";
import { env } from "@/lib/env";

// Request body types
interface NewsletterRequestBody {
  email: string;
  firstName?: string;
  tags?: Array<string | number>;
}

// ConvertKit response types
interface ConvertKitErrorResponse {
  message?: string;
  error?: string;
}

interface NewsletterSuccessResponse {
  ok: true;
  message?: string;
}

interface NewsletterErrorResponse {
  error: string;
}

// Assertion function for request body
function assertNewsletterBody(body: unknown): asserts body is NewsletterRequestBody {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const b = body as Partial<NewsletterRequestBody>;

  if (!b.email || typeof b.email !== 'string' || !b.email.includes('@')) {
    throw new Error('Valid email is required');
  }

  if (b.firstName !== undefined && typeof b.firstName !== 'string') {
    throw new Error('firstName must be a string');
  }

  if (b.tags !== undefined && !Array.isArray(b.tags)) {
    throw new Error('tags must be an array');
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<NewsletterSuccessResponse | NewsletterErrorResponse>> {
  const ip = ipFromHeaders(req.headers);
  try {
    await requireRateLimit(newsletterLimiter, ip, "Too many signups. Please try again later.");
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
    assertNewsletterBody(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    );
  }

  const { email, firstName, tags } = body;

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

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    console.error('Failed to parse ConvertKit response:', error);
    if (!response.ok) {
      return NextResponse.json({ error: "Unable to subscribe" }, { status: 502 });
    }
    // If response was OK but JSON parsing failed, still return success
    return NextResponse.json({ ok: true });
  }

  if (!response.ok) {
    const errorResponse = json as ConvertKitErrorResponse;
    const message = errorResponse.message || errorResponse.error || "Unable to subscribe.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
