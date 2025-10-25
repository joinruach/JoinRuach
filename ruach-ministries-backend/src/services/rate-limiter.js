"use strict";

/**
 * Rate Limiter Service for Strapi Backend
 *
 * Provides rate limiting functionality for authentication endpoints
 * to prevent brute force attacks. Uses in-memory storage with
 * optional Redis support for production.
 */

class RateLimiter {
  constructor() {
    // In-memory storage for rate limit tracking
    // Format: { key: { count: number, resetAt: timestamp } }
    this.attempts = new Map();

    // Cleanup interval (every 5 minutes)
    this.cleanupInterval = 5 * 60 * 1000;
    this.startCleanup();
  }

  /**
   * Check if request should be rate limited
   * @param {string} key - Unique identifier (IP, username, etc.)
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} - { allowed: boolean, remaining: number, resetAt: number }
   */
  check(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const record = this.attempts.get(key);

    // No previous attempts or window expired
    if (!record || now > record.resetAt) {
      const resetAt = now + windowMs;
      this.attempts.set(key, {
        count: 1,
        resetAt
      });

      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetAt
      };
    }

    // Increment attempt count
    record.count++;
    this.attempts.set(key, record);

    const allowed = record.count <= maxAttempts;
    const remaining = Math.max(0, maxAttempts - record.count);

    if (!allowed) {
      strapi.log.warn(`Rate limit exceeded for key: ${key.substring(0, 20)}...`);
    }

    return {
      allowed,
      remaining,
      resetAt: record.resetAt
    };
  }

  /**
   * Reset rate limit for a specific key
   * @param {string} key - Unique identifier
   */
  reset(key) {
    const deleted = this.attempts.delete(key);
    if (deleted) {
      strapi.log.info(`Rate limit reset for key: ${key.substring(0, 20)}...`);
    }
    return deleted;
  }

  /**
   * Get client IP from request context
   * @param {object} ctx - Koa context
   * @returns {string} - IP address
   */
  getClientIp(ctx) {
    // Check common proxy headers
    const forwarded = ctx.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    const realIp = ctx.get("x-real-ip");
    if (realIp) {
      return realIp;
    }

    // Fallback to direct connection
    return ctx.ip || ctx.request.ip || "unknown";
  }

  /**
   * Clean up expired rate limit records
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetAt) {
        this.attempts.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      strapi.log.info(`Cleaned up ${removed} expired rate limit records`);
    }
  }

  /**
   * Start periodic cleanup of expired records
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Get current number of tracked keys
   */
  size() {
    return this.attempts.size;
  }

  /**
   * Clear all rate limit records (for testing)
   */
  clear() {
    this.attempts.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware factory
 * @param {object} options - Configuration options
 * @param {number} options.maxAttempts - Maximum attempts allowed
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {string} options.keyPrefix - Prefix for rate limit key
 * @param {function} options.keyGenerator - Custom key generator function
 * @returns {function} - Koa middleware
 */
function createRateLimitMiddleware(options = {}) {
  const {
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000, // 15 minutes
    keyPrefix = "rl",
    keyGenerator = null
  } = options;

  return async (ctx, next) => {
    // Generate rate limit key
    let key;
    if (keyGenerator && typeof keyGenerator === "function") {
      key = keyGenerator(ctx);
    } else {
      const ip = rateLimiter.getClientIp(ctx);
      key = `${keyPrefix}:${ip}`;
    }

    // Check rate limit
    const result = rateLimiter.check(key, maxAttempts, windowMs);

    // Set rate limit headers
    ctx.set("X-RateLimit-Limit", String(maxAttempts));
    ctx.set("X-RateLimit-Remaining", String(result.remaining));
    ctx.set("X-RateLimit-Reset", String(result.resetAt));

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      ctx.set("Retry-After", String(retryAfter));

      return ctx.tooManyRequests(
        "Too many requests. Please try again later.",
        {
          retryAfter,
          resetAt: result.resetAt
        }
      );
    }

    await next();
  };
}

module.exports = {
  rateLimiter,
  RateLimiter,
  createRateLimitMiddleware
};
