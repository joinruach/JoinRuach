"use strict";

/**
 * Strapi Bootstrap File
 *
 * This file runs when Strapi starts up.
 * Use it to initialize services, connections, and other startup tasks.
 */

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    strapi.log.info("🚀 Strapi bootstrap starting...");

    // Initialize Redis-backed services
    try {
      const { redisClient } = require("./services/redis-client");
      const { tokenBlacklist } = require("./services/token-blacklist");
      const { refreshTokenStore } = require("./services/refresh-token-store");
      const { rateLimiter } = require("./services/rate-limiter");

      // Connect Redis client
      await redisClient.connect();
      strapi.log.info("✅ Redis client connected");

      // Initialize token blacklist with Redis
      if (typeof tokenBlacklist.init === "function") {
        await tokenBlacklist.init();
      }

      // Initialize refresh token store with Redis
      if (typeof refreshTokenStore.init === "function") {
        await refreshTokenStore.init();
      }

      // Initialize rate limiter with Redis
      if (typeof rateLimiter.init === "function") {
        await rateLimiter.init();
      }

      strapi.log.info("✅ Token storage services initialized");
    } catch (error) {
      strapi.log.error("❌ Error initializing Redis services:", error);
      // Don't fail startup - services will fall back to in-memory
    }

    strapi.log.info("✅ Strapi bootstrap complete");
  },
};
