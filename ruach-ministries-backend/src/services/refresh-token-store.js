"use strict";

const crypto = require("crypto");
const { redisClient } = require("./redis-client");

/**
 * Refresh Token Store Service
 *
 * Manages refresh tokens with rotation support.
 * Uses Redis for persistence with fallback to in-memory storage.
 */

class RefreshTokenStore {
  constructor() {
    // In-memory storage for refresh tokens (fallback)
    // Format: { tokenHash: { userId, expiresAt, used: boolean, createdAt } }
    this.tokens = new Map();

    // Redis key prefix
    this.keyPrefix = "refresh:";

    // Cleanup interval (every 10 minutes)
    this.cleanupInterval = 10 * 60 * 1000;
    this.startCleanup();
  }

  /**
   * Initialize Redis connection
   */
  async init() {
    await redisClient.connect();
    if (redisClient.isAvailable()) {
      strapi.log.info("[RefreshTokenStore] Using Redis for persistence");
    } else {
      strapi.log.warn("[RefreshTokenStore] Redis not available, using in-memory storage");
    }
  }

  /**
   * Generate a unique token hash
   * @param {string} token - The refresh token
   * @returns {string} - SHA256 hash of the token
   */
  hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Store a new refresh token
   * @param {string} token - The refresh token
   * @param {number} userId - User ID
   * @param {number} expiresAt - Unix timestamp when token expires
   * @returns {string} - Token hash
   */
  async store(token, userId, expiresAt) {
    const tokenHash = this.hashToken(token);
    const tokenData = {
      userId,
      expiresAt,
      used: false,
      createdAt: Date.now()
    };

    const ttl = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

    // Try Redis first
    if (redisClient.isAvailable()) {
      const key = `${this.keyPrefix}${tokenHash}`;
      const success = await redisClient.set(key, JSON.stringify(tokenData), ttl);

      if (success) {
        strapi.log.info(`[RefreshTokenStore] Refresh token stored in Redis for user ${userId}`);
        return tokenHash;
      }

      // Redis failed, fall back to in-memory
      strapi.log.warn("[RefreshTokenStore] Redis set failed, falling back to in-memory");
    }

    // In-memory fallback
    this.tokens.set(tokenHash, tokenData);
    strapi.log.info(`[RefreshTokenStore] Refresh token stored in memory for user ${userId}`);
    return tokenHash;
  }

  /**
   * Validate and mark a refresh token as used
   * @param {string} token - The refresh token
   * @returns {object|null} - Token data if valid, null otherwise
   */
  async validate(token) {
    const tokenHash = this.hashToken(token);
    let tokenData = null;

    // Try Redis first
    if (redisClient.isAvailable()) {
      const key = `${this.keyPrefix}${tokenHash}`;
      const data = await redisClient.get(key);

      if (data) {
        tokenData = JSON.parse(data);
      }
    }

    // Fallback to in-memory
    if (!tokenData) {
      tokenData = this.tokens.get(tokenHash);
    }

    if (!tokenData) {
      strapi.log.warn("[RefreshTokenStore] Refresh token not found in store");
      return null;
    }

    // Check if already used (token reuse detection)
    if (tokenData.used) {
      strapi.log.error(`[RefreshTokenStore] Refresh token reuse detected for user ${tokenData.userId}!`);
      // Invalidate all tokens for this user (security measure)
      await this.revokeAllForUser(tokenData.userId);
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now > tokenData.expiresAt) {
      strapi.log.warn("[RefreshTokenStore] Refresh token expired");

      // Delete from both stores
      if (redisClient.isAvailable()) {
        const key = `${this.keyPrefix}${tokenHash}`;
        await redisClient.del(key);
      }
      this.tokens.delete(tokenHash);
      return null;
    }

    // Mark as used (rotation)
    tokenData.used = true;

    // Update in Redis
    if (redisClient.isAvailable()) {
      const key = `${this.keyPrefix}${tokenHash}`;
      const ttl = Math.max(0, Math.floor((tokenData.expiresAt - Date.now()) / 1000));
      await redisClient.set(key, JSON.stringify(tokenData), ttl);
    }

    // Update in-memory
    this.tokens.set(tokenHash, tokenData);

    return tokenData;
  }

  /**
   * Revoke a specific refresh token
   * @param {string} token - The refresh token
   */
  async revoke(token) {
    const tokenHash = this.hashToken(token);

    // Delete from Redis
    if (redisClient.isAvailable()) {
      const key = `${this.keyPrefix}${tokenHash}`;
      await redisClient.del(key);
    }

    // Delete from in-memory
    const deleted = this.tokens.delete(tokenHash);

    if (deleted || redisClient.isAvailable()) {
      strapi.log.info("[RefreshTokenStore] Refresh token revoked");
    }

    return deleted;
  }

  /**
   * Revoke all refresh tokens for a user
   * @param {number} userId - User ID
   */
  async revokeAllForUser(userId) {
    let count = 0;

    // Revoke from Redis
    if (redisClient.isAvailable()) {
      try {
        const pattern = `${this.keyPrefix}*`;
        const keys = await redisClient.keys(pattern);

        for (const key of keys) {
          const data = await redisClient.get(key);
          if (data) {
            const tokenData = JSON.parse(data);
            if (tokenData.userId === userId) {
              await redisClient.del(key);
              count++;
            }
          }
        }
      } catch (error) {
        strapi.log.error("[RefreshTokenStore] Error revoking user tokens from Redis:", error.message);
      }
    }

    // Revoke from in-memory
    for (const [tokenHash, tokenData] of this.tokens.entries()) {
      if (tokenData.userId === userId) {
        this.tokens.delete(tokenHash);
        count++;
      }
    }

    if (count > 0) {
      strapi.log.info(`[RefreshTokenStore] Revoked ${count} refresh tokens for user ${userId}`);
    }

    return count;
  }

  /**
   * Remove expired and used tokens from store
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [tokenHash, tokenData] of this.tokens.entries()) {
      // Remove if expired or used (and older than 1 hour)
      if (now > tokenData.expiresAt || (tokenData.used && now - tokenData.createdAt > 3600000)) {
        this.tokens.delete(tokenHash);
        removed++;
      }
    }

    if (removed > 0) {
      strapi.log.info(`Cleaned up ${removed} refresh tokens from store`);
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
   * Get current token count
   */
  size() {
    return this.tokens.size;
  }

  /**
   * Clear all tokens (for testing)
   */
  clear() {
    this.tokens.clear();
  }
}

// Singleton instance
const refreshTokenStore = new RefreshTokenStore();

module.exports = {
  refreshTokenStore,
  RefreshTokenStore
};
