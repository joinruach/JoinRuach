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
   * @returns {Promise<object>} - { allowed: boolean, remaining: number, resetAt: number }
   */
  async check(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    let record = null;

    // Try Redis first
    if (redisClient.isAvailable()) {
      const redisKey = `${this.keyPrefix}${key}`;
      const data = await redisClient.get(redisKey);

      if (data) {
        record = JSON.parse(data);
      }
    }

    // Fallback to in-memory if Redis not available or no record found
    if (!record && !redisClient.isAvailable()) {
      record = this.attempts.get(key);
    }

    // No previous attempts or window expired
    if (!record || now > record.resetAt) {
      const resetAt = now + windowMs;
      const newRecord = {
        count: 1,
        resetAt
      };

      // Store in Redis
      if (redisClient.isAvailable()) {
        const redisKey = `${this.keyPrefix}${key}`;
        const ttl = Math.ceil(windowMs / 1000);
        await redisClient.set(redisKey, JSON.stringify(newRecord), ttl);
      }

      // Store in-memory fallback
      this.attempts.set(key, newRecord);

      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetAt
      };
    }

    // Increment attempt count
    record.count++;

    // Update in Redis
    if (redisClient.isAvailable()) {
      const redisKey = `${this.keyPrefix}${key}`;
      const ttl = Math.ceil((record.resetAt - now) / 1000);
      await redisClient.set(redisKey, JSON.stringify(record), ttl);
    }

    // Update in-memory
    this.attempts.set(key, record);

    const allowed = record.count <= maxAttempts;
    const remaining = Math.max(0, maxAttempts - record.count);

    if (!allowed) {
      logger.logRateLimit('Limit exceeded', {
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
    let deleted = false;

    // Delete from Redis
    if (redisClient.isAvailable()) {
      const redisKey = `${this.keyPrefix}${key}`;
      await redisClient.del(redisKey);
      deleted = true;
    }

    // Delete from in-memory
    const memDeleted = this.attempts.delete(key);
    deleted = deleted || memDeleted;

    if (deleted) {
      logger.logRateLimit('Limit reset', {
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
  async clear() {
    this.attempts.clear();

    // Also clear from Redis
    if (redisClient.isAvailable()) {
      const keys = await redisClient.keys(`${this.keyPrefix}*`);
      for (const key of keys) {
        await redisClient.del(key);
      }
    }
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

    // Check rate limit (now async)
    const result = await rateLimiter.check(key, maxAttempts, windowMs);

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
