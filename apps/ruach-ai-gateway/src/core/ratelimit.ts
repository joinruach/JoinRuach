import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { Context, Next } from "hono";
import { getAuthContext } from "./auth.js";
import { RATE_LIMITS, type UserTier } from "../types/index.js";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiters for each tier
const rateLimiters: Record<UserTier, Ratelimit> = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.free.requests, RATE_LIMITS.free.window as Duration),
    prefix: "rl:chat:free",
  }),
  supporter: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      RATE_LIMITS.supporter.requests,
      RATE_LIMITS.supporter.window as Duration
    ),
    prefix: "rl:chat:supporter",
  }),
  partner: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.partner.requests, RATE_LIMITS.partner.window as Duration),
    prefix: "rl:chat:partner",
  }),
  builder: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.builder.requests, RATE_LIMITS.builder.window as Duration),
    prefix: "rl:chat:builder",
  }),
  admin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.admin.requests, RATE_LIMITS.admin.window as Duration),
    prefix: "rl:chat:admin",
  }),
};

/**
 * Rate limiting middleware
 * Limits requests based on user tier
 */
export async function rateLimitMiddleware(c: Context, next: Next) {
  const auth = getAuthContext(c);
  const limiter = rateLimiters[auth.tier];

  const { success, limit, remaining, reset } = await limiter.limit(auth.userId);

  // Set rate limit headers
  c.header("X-RateLimit-Limit", limit.toString());
  c.header("X-RateLimit-Remaining", remaining.toString());
  c.header("X-RateLimit-Reset", reset.toString());

  if (!success) {
    return c.json(
      {
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      429
    );
  }

  await next();
}

/**
 * Check daily token budget
 */
export async function checkTokenBudget(
  userId: string,
  tier: UserTier,
  tokensToUse: number
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const key = `budget:${userId}:${today}`;

  const used = (await redis.get<number>(key)) || 0;
  const limit = (await import("../types/index.js")).TOKEN_BUDGETS[tier];

  if (used + tokensToUse > limit) {
    return { allowed: false, used, limit };
  }

  return { allowed: true, used, limit };
}

/**
 * Increment token usage for the day
 */
export async function incrementTokenUsage(userId: string, tokens: number): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const key = `budget:${userId}:${today}`;

  await redis.incrby(key, tokens);
  // Expire at end of day (24 hours from first use)
  await redis.expire(key, 86400);
}

/**
 * Get current token usage for user
 */
export async function getTokenUsage(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const key = `budget:${userId}:${today}`;

  return (await redis.get<number>(key)) || 0;
}
