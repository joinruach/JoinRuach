/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

// In-memory rate limiting (for development)
// In production, use Redis-backed rate limiting

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  max: number; // Max requests
  windowMs: number; // Time window in milliseconds
  message?: string;
  skipSuccessfulRequests?: boolean;
}

export function createRateLimiter(config: RateLimitConfig) {
  const {
    max,
    windowMs,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
  } = config;

  return async (ctx: any, next: () => Promise<void>) => {
    const key = ctx.request.ip || ctx.request.header['x-forwarded-for'] || 'unknown';
    const now = Date.now();

    if (!store[key] || store[key].resetAt < now) {
      store[key] = {
        count: 0,
        resetAt: now + windowMs,
      };
    }

    store[key].count++;

    const remaining = Math.max(0, max - store[key].count);
    const resetAt = new Date(store[key].resetAt);

    // Set rate limit headers
    ctx.set('X-RateLimit-Limit', String(max));
    ctx.set('X-RateLimit-Remaining', String(remaining));
    ctx.set('X-RateLimit-Reset', resetAt.toISOString());

    if (store[key].count > max) {
      ctx.status = 429;
      ctx.body = {
        error: message,
        retryAfter: Math.ceil((store[key].resetAt - now) / 1000),
      };
      return;
    }

    await next();

    // If configured to skip successful requests, decrement counter
    if (skipSuccessfulRequests && ctx.status < 400) {
      store[key].count = Math.max(0, store[key].count - 1);
    }
  };
}

// Predefined rate limiters

export const strictRateLimit = createRateLimiter({
  max: 10,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many requests. Please wait before trying again.',
});

export const moderateRateLimit = createRateLimiter({
  max: 30,
  windowMs: 60 * 1000, // 1 minute
});

export const lenientRateLimit = createRateLimiter({
  max: 100,
  windowMs: 60 * 1000, // 1 minute
});

export const writeRateLimit = createRateLimiter({
  max: 20,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many write requests. Please slow down.',
  skipSuccessfulRequests: false,
});

export const readRateLimit = createRateLimiter({
  max: 100,
  windowMs: 60 * 1000, // 1 minute
  skipSuccessfulRequests: true, // Don't count successful reads
});
