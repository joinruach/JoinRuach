/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

// In-memory rate limiting (for development). Use Redis-backed rate limiting in production.
type MiddlewareFactory = (
  config: any,
  context: { strapi: any }
) => (ctx: any, next: () => Promise<void>) => Promise<void>;

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};
const DEFAULT_MESSAGE = 'Too many requests, please try again later.';

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

const getClientIp = (ctx: any) =>
  ctx.request.ip || ctx.request.header['x-forwarded-for'] || 'unknown';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Default export: allows using this middleware via config/middlewares.js
const rateLimitMiddleware: MiddlewareFactory = (config = {}) => {
  const {
    interval = 60_000,
    max = 100,
    prefixKey = 'rl:',
    delayAfter,
    timeWait = 0,
    whitelist = [],
    message = DEFAULT_MESSAGE,
  } = config as {
    interval?: number;
    max?: number;
    prefixKey?: string;
    delayAfter?: number;
    timeWait?: number;
    whitelist?: string[];
    message?: string;
  };

  const whitelistSet = new Set(whitelist);

  return async (ctx, next) => {
    const ip = getClientIp(ctx);
    if (whitelistSet.has(ip)) {
      return next();
    }

    const now = Date.now();
    const key = `${prefixKey}${ip}`;

    if (!store[key] || store[key].resetAt < now) {
      store[key] = {
        count: 0,
        resetAt: now + interval,
      };
    }

    store[key].count++;

    const remaining = Math.max(0, max - store[key].count);
    const resetAt = new Date(store[key].resetAt);

    ctx.set('X-RateLimit-Limit', String(max));
    ctx.set('X-RateLimit-Remaining', String(remaining));
    ctx.set('X-RateLimit-Reset', resetAt.toISOString());

    if (delayAfter && store[key].count > delayAfter && timeWait > 0) {
      await sleep(timeWait);
    }

    if (store[key].count > max) {
      ctx.status = 429;
      ctx.body = {
        error: message,
        retryAfter: Math.ceil((store[key].resetAt - now) / 1000),
      };
      return;
    }

    await next();
  };
};

export default rateLimitMiddleware;
