"use strict";

/**
 * Rate Limiter Service for Strapi Backend
 *
 * Provides rate limiting functionality for authentication endpoints
 * to prevent brute force attacks. Uses Redis for persistence with
 * fallback to in-memory storage.
 */

const logger = require('../config/logger');
const { redisClient } = require('./redis-client');

class RateLimiter {
  constructor() {
    // In-memory storage for rate limit tracking (fallback)
    // Format: { key: { count: number, resetAt: timestamp } }
    this.attempts = new Map();

    // Redis key prefix
    this.keyPrefix = "ratelimit:";

    // Cleanup interval (every 5 minutes)
    this.cleanupInterval = 5 * 60 * 1000;
    this.startCleanup();
  }

  /**
   * Initialize Redis connection
   */
  async init() {
    await redisClient.connect();
    if (redisClient.isAvailable()) {
      strapi.log.info("[RateLimiter] Using Redis for persistence");
    } else {
      strapi.log.warn("[RateLimiter] Redis not available, using in-memory storage");
    }
  }

  /**
   * Check if request should be rate limited
   * @param {string} key - Unique identifier (IP, username, etc.)
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} - { allowed: boolean, remaining: number, resetAt: number }
   */
  async check(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();

    // Try Redis first
    if (redisClient.isAvailable()) {
      return await this._checkRedis(key, maxAttempts, windowMs, now);
    }

    // Fall back to in-memory
    return this._checkInMemory(key, maxAttempts, windowMs, now);
  }

  /**
   * Check rate limit using Redis
   */
  async _checkRedis(key, maxAttempts, windowMs, now) {
    const redisKey = `${this.keyPrefix}${key}`;
    const resetAt = now + windowMs;

    try {
      // Increment counter
      const count = await redisClient.incr(redisKey);

      // Set expiry on first request
      if (count === 1) {
        const ttl = Math.ceil(windowMs / 1000);
        await redisClient.expire(redisKey, ttl);
      }

      const allowed = count <= maxAttempts;
      const remaining = Math.max(0, maxAttempts - count);

      if (!allowed) {
        logger.logRateLimit('Limit exceeded (Redis)', {
          key: key.substring(0, 30),
          attempts: count,
          maxAttempts,
          resetAt: new Date(resetAt).toISOString(),
        });
      }

      return {
        allowed,
        remaining,
        resetAt
      };
    } catch (error) {
      logger.logSecurity('Redis rate limit check failed, falling back to in-memory', {
        error: error.message,
        key: key.substring(0, 30),
      });

      // Fall back to in-memory
      return this._checkInMemory(key, maxAttempts, windowMs, now);
    }
  }

  /**
   * Check rate limit using in-memory storage
   */
  _checkInMemory(key, maxAttempts, windowMs, now) {
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
      logger.logRateLimit('Limit exceeded (in-memory)', {
        key: key.substring(0, 30),
        attempts: record.count,
        maxAttempts,
        resetAt: new Date(record.resetAt).toISOString(),
      });
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
  async reset(key) {
    // Try Redis first
    if (redisClient.isAvailable()) {
      try {
        const redisKey = `${this.keyPrefix}${key}`;
        const success = await redisClient.del(redisKey);

        if (success) {
          logger.logRateLimit('Limit reset (Redis)', {
            key: key.substring(0, 30),
            reason: 'successful_authentication',
          });
          return true;
        }
      } catch (error) {
        logger.logSecurity('Redis rate limit reset failed, falling back to in-memory', {
          error: error.message,
          key: key.substring(0, 30),
        });
      }
    }

    // Fall back to in-memory
    const deleted = this.attempts.delete(key);
    if (deleted) {
      logger.logRateLimit('Limit reset (in-memory)', {
        key: key.substring(0, 30),
        reason: 'successful_authentication',
      });
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
      logger.debug('Rate limit cleanup completed', {
        category: 'rate_limit',
        removedCount: removed,
        remainingCount: this.attempts.size,
      });
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
