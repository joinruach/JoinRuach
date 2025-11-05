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

// Authentication rate limiters
export const loginLimiter = createLimiter(5, "15 m", "rl:login"); // 5 attempts per 15 minutes per IP
export const loginUsernameLimiter = createLimiter(3, "15 m", "rl:login:user"); // 3 attempts per 15 minutes per username

// Form submission rate limiters
export const signupLimiter = createLimiter(5, "10 m", "rl:signup");
export const resendLimiter = createLimiter(8, "10 m", "rl:resend");
export const forgotPasswordLimiter = createLimiter(5, "10 m", "rl:forgot");
export const resetPasswordLimiter = createLimiter(8, "10 m", "rl:reset");
export const reportsLimiter = createLimiter(5, "10 m", "rl:reports");
export const volunteerLimiter = createLimiter(5, "10 m", "rl:volunteer");
export const contactLimiter = createLimiter(6, "10 m", "rl:contact");
export const testimonyLimiter = createLimiter(3, "15 m", "rl:testimony");
export const newsletterLimiter = createLimiter(10, "10 m", "rl:newsletter");

// Content interaction rate limiters
export const commentsGetLimiter = createLimiter(100, "1 m", "rl:comments:get"); // 100 requests per minute
export const commentsPostLimiter = createLimiter(10, "5 m", "rl:comments:post"); // 10 comments per 5 minutes
export const progressLimiter = createLimiter(30, "1 m", "rl:progress"); // 30 saves per minute
export const moderateLimiter = createLimiter(50, "5 m", "rl:moderate"); // 50 moderation actions per 5 minutes

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
