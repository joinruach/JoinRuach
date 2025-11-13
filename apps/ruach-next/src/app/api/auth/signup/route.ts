import { NextRequest, NextResponse } from "next/server";
import {
  signupLimiter,
  ipFromHeaders,
  requireRateLimit,
  rateLimitResponse,
  RateLimitError,
} from "@/lib/ratelimit";
import { env } from "@/lib/env";

const STRAPI = env.NEXT_PUBLIC_STRAPI_URL;

// Request body types
interface SignupRequestBody {
  email: string;
  password: string;
  username?: string;
}

// Strapi response types
interface StrapiSignupResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

interface StrapiSignupError {
  error?: {
    status: number;
    name: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

function assertSignupBody(body: unknown): asserts body is SignupRequestBody {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const b = body as Partial<SignupRequestBody>;

  if (!b.email || typeof b.email !== 'string' || !b.email.includes('@')) {
    throw new Error('Valid email is required');
  }

  if (!b.password || typeof b.password !== 'string' || b.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (b.username !== undefined && typeof b.username !== 'string') {
    throw new Error('Username must be a string');
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = ipFromHeaders(req.headers);

  try {
    await requireRateLimit(signupLimiter, ip, "Too many signups. Try later.");
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
    assertSignupBody(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    );
  }

  const { email, password, username } = body;

  try {
    const r = await fetch(`${STRAPI}/api/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        username: username || email,
        password
      })
    });

    let responseData: StrapiSignupResponse | StrapiSignupError;
    try {
      responseData = await r.json();
    } catch (error) {
      console.error('Failed to parse Strapi response:', error);
      return NextResponse.json(
        { error: "Invalid response from authentication service" },
        { status: 500 }
      );
    }

    if (!r.ok) {
      const errorResponse = responseData as StrapiSignupError;
      const message = errorResponse.error?.message || "Signup failed";
      return NextResponse.json({ error: message }, { status: r.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
