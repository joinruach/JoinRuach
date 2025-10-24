"use strict";

const crypto = require("crypto");

/**
 * Refresh Token Store Service
 *
 * Manages refresh tokens with rotation support.
 * Stores tokens in-memory with optional database persistence.
 */

class RefreshTokenStore {
  constructor() {
    // In-memory storage for refresh tokens
    // Format: { tokenHash: { userId, expiresAt, used: boolean, createdAt } }
    this.tokens = new Map();

    // Cleanup interval (every 10 minutes)
    this.cleanupInterval = 10 * 60 * 1000;
    this.startCleanup();
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
  store(token, userId, expiresAt) {
    const tokenHash = this.hashToken(token);

    this.tokens.set(tokenHash, {
      userId,
      expiresAt,
      used: false,
      createdAt: Date.now()
    });

    strapi.log.info(`Refresh token stored for user ${userId}`);
    return tokenHash;
  }

  /**
   * Validate and mark a refresh token as used
   * @param {string} token - The refresh token
   * @returns {object|null} - Token data if valid, null otherwise
   */
  validate(token) {
    const tokenHash = this.hashToken(token);
    const tokenData = this.tokens.get(tokenHash);

    if (!tokenData) {
      strapi.log.warn("Refresh token not found in store");
      return null;
    }

    // Check if already used (token reuse detection)
    if (tokenData.used) {
      strapi.log.error(`Refresh token reuse detected for user ${tokenData.userId}!`);
      // Invalidate all tokens for this user (security measure)
      this.revokeAllForUser(tokenData.userId);
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now > tokenData.expiresAt) {
      strapi.log.warn("Refresh token expired");
      this.tokens.delete(tokenHash);
      return null;
    }

    // Mark as used (rotation)
    tokenData.used = true;
    this.tokens.set(tokenHash, tokenData);

    return tokenData;
  }

  /**
   * Revoke a specific refresh token
   * @param {string} token - The refresh token
   */
  revoke(token) {
    const tokenHash = this.hashToken(token);
    const deleted = this.tokens.delete(tokenHash);

    if (deleted) {
      strapi.log.info("Refresh token revoked");
    }

    return deleted;
  }

  /**
   * Revoke all refresh tokens for a user
   * @param {number} userId - User ID
   */
  revokeAllForUser(userId) {
    let count = 0;

    for (const [tokenHash, tokenData] of this.tokens.entries()) {
      if (tokenData.userId === userId) {
        this.tokens.delete(tokenHash);
        count++;
      }
    }

    if (count > 0) {
      strapi.log.info(`Revoked ${count} refresh tokens for user ${userId}`);
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
