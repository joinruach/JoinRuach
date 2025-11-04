"use strict";

const { redisClient } = require("./redis-client");

/**
 * Token Blacklist Service
 *
 * Manages revoked/blacklisted tokens to prevent their reuse after logout
 * or token refresh. Uses Redis for persistence with fallback to in-memory storage.
 */

class TokenBlacklist {
  constructor() {
    // In-memory storage for blacklisted tokens (fallback)
    // Format: { tokenId: expiryTimestamp }
    this.blacklist = new Map();

    // Redis key prefix
    this.keyPrefix = "blacklist:";

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
      strapi.log.info("[TokenBlacklist] Using Redis for persistence");
    } else {
      strapi.log.warn("[TokenBlacklist] Redis not available, using in-memory storage");
    }
  }

  /**
   * Add a token to the blacklist
   * @param {string} tokenId - The token ID (jti) or token hash
   * @param {number} expiresAt - Unix timestamp when token expires
   */
  async add(tokenId, expiresAt) {
    if (!tokenId) {
      throw new Error("Token ID is required");
    }

    const ttl = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

    // Try Redis first
    if (redisClient.isAvailable()) {
      const key = `${this.keyPrefix}${tokenId}`;
      const success = await redisClient.set(key, expiresAt.toString(), ttl);

      if (success) {
        strapi.log.info(`[TokenBlacklist] Token ${tokenId.substring(0, 8)}... added to Redis blacklist`);
        return;
      }

      // Redis failed, fall back to in-memory
      strapi.log.warn("[TokenBlacklist] Redis set failed, falling back to in-memory");
    }

    // In-memory fallback
    this.blacklist.set(tokenId, expiresAt);
    strapi.log.info(`[TokenBlacklist] Token ${tokenId.substring(0, 8)}... added to in-memory blacklist`);
  }

  /**
   * Check if a token is blacklisted
   * @param {string} tokenId - The token ID (jti) or token hash
   * @returns {boolean} - True if token is blacklisted
   */
  async isBlacklisted(tokenId) {
    if (!tokenId) {
      return false;
    }

    // Try Redis first
    if (redisClient.isAvailable()) {
      const key = `${this.keyPrefix}${tokenId}`;
      const exists = await redisClient.exists(key);

      if (exists) {
        return true;
      }
    }

    // Check in-memory fallback
    const expiresAt = this.blacklist.get(tokenId);

    // Not in blacklist
    if (!expiresAt) {
      return false;
    }

    // Check if expired (past expiry time)
    const now = Date.now();
    if (now > expiresAt) {
      // Token naturally expired, remove from blacklist
      this.blacklist.delete(tokenId);
      return false;
    }

    return true;
  }

  /**
   * Remove expired tokens from blacklist (in-memory only)
   * Redis automatically expires keys with TTL
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [tokenId, expiresAt] of this.blacklist.entries()) {
      if (now > expiresAt) {
        this.blacklist.delete(tokenId);
        removed++;
      }
    }

    if (removed > 0) {
      strapi.log.info(`[TokenBlacklist] Cleaned up ${removed} expired tokens from in-memory blacklist`);
    }
  }

  /**
   * Start periodic cleanup of expired tokens
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Get current blacklist size (in-memory only)
   */
  size() {
    return this.blacklist.size;
  }

  /**
   * Clear all tokens (for testing)
   */
  async clear() {
    this.blacklist.clear();

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
const tokenBlacklist = new TokenBlacklist();

module.exports = {
  tokenBlacklist,
  TokenBlacklist
};
