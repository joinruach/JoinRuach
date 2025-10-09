import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Fallback limiter when Upstash credentials are not configured.
type LimitResult = Awaited<ReturnType<Ratelimit["limit"]>>;

type Limiter = {
  limit: (identifier: string) => Promise<LimitResult>;
};

function noopLimiter(limit: number): Limiter {
  return {
    async limit(): Promise<LimitResult> {
      return {
        success: true,
        remaining: limit,
        limit,
        reset: Date.now() + 60_000,
        pending: Promise.resolve(),
      };
    },
  };
}

function createLimiter(
  count: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
  prefix: string
): Limiter {
  if (!redis) {
    return noopLimiter(count);
  }
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(count, window), prefix });
}

export const signupLimiter = createLimiter(5, "10 m", "rl:signup");
export const resendLimiter = createLimiter(8, "10 m", "rl:resend");
export const reportsLimiter = createLimiter(5, "10 m", "rl:reports");
export const volunteerLimiter = createLimiter(5, "10 m", "rl:volunteer");
export const contactLimiter = createLimiter(6, "10 m", "rl:contact");
export const newsletterLimiter = createLimiter(10, "10 m", "rl:newsletter");

export function ipFromHeaders(h: Headers) {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export class RateLimitError extends Error {
  status: number;
  retryAfter?: number;

  constructor(message = "Too many requests", status = 429, retryAfter?: number) {
    super(message);
    this.name = "RateLimitError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export async function requireRateLimit(
  limiter: Limiter,
  identifier: string,
  message = "Too many requests"
) {
  const result = await limiter.limit(identifier);
  if (!result.success) {
    const retryAfter = result.reset ? Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)) : undefined;
    throw new RateLimitError(message, 429, retryAfter);
  }
  return result;
}

export function rateLimitResponse(error: RateLimitError) {
  const headers: Record<string, string> = {};
  if (typeof error.retryAfter === "number" && Number.isFinite(error.retryAfter)) {
    headers["Retry-After"] = String(error.retryAfter);
  }
  return NextResponse.json({ error: error.message }, { status: error.status, headers });
}
