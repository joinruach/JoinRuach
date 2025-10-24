"use strict";

/**
 * Token Blacklist Service
 *
 * Manages revoked/blacklisted tokens to prevent their reuse after logout
 * or token refresh. Uses in-memory storage with optional Redis support.
 */

class TokenBlacklist {
  constructor() {
    // In-memory storage for blacklisted tokens
    // Format: { tokenId: expiryTimestamp }
    this.blacklist = new Map();

    // Cleanup interval (every 5 minutes)
    this.cleanupInterval = 5 * 60 * 1000;
    this.startCleanup();
  }

  /**
   * Add a token to the blacklist
   * @param {string} tokenId - The token ID (jti) or token hash
   * @param {number} expiresAt - Unix timestamp when token expires
   */
  add(tokenId, expiresAt) {
    if (!tokenId) {
      throw new Error("Token ID is required");
    }

    // Store with expiry time
    this.blacklist.set(tokenId, expiresAt);

    strapi.log.info(`Token ${tokenId.substring(0, 8)}... added to blacklist`);
  }

  /**
   * Check if a token is blacklisted
   * @param {string} tokenId - The token ID (jti) or token hash
   * @returns {boolean} - True if token is blacklisted
   */
  isBlacklisted(tokenId) {
    if (!tokenId) {
      return false;
    }

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
   * Remove expired tokens from blacklist
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
      strapi.log.info(`Cleaned up ${removed} expired tokens from blacklist`);
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
   * Get current blacklist size
   */
  size() {
    return this.blacklist.size;
  }

  /**
   * Clear all tokens (for testing)
   */
  clear() {
    this.blacklist.clear();
  }
}

// Singleton instance
const tokenBlacklist = new TokenBlacklist();

module.exports = {
  tokenBlacklist,
  TokenBlacklist
};
