"use strict";

/**
 * Rate Limit Uploads Policy
 *
 * Prevents abuse of file upload endpoints by rate limiting
 * based on IP address and user authentication.
 */

module.exports = async (ctx, config, { strapi }) => {
  const { rateLimiter } = require("../services/rate-limiter");

  const clientIp = rateLimiter.getClientIp(ctx);
  const userId = ctx.state?.user?.id || "anonymous";

  // Different limits for authenticated vs anonymous users
  const isAuthenticated = !!ctx.state?.user;
  const maxUploads = isAuthenticated ? 20 : 5; // 20 for auth, 5 for anonymous
  const windowMs = 60 * 60 * 1000; // 1 hour

  // Rate limit key combines IP and user ID for better security
  const rateLimitKey = `upload:${userId}:${clientIp}`;

  const rateLimit = rateLimiter.check(rateLimitKey, maxUploads, windowMs);

  // Set rate limit headers
  ctx.set("X-RateLimit-Limit", String(maxUploads));
  ctx.set("X-RateLimit-Remaining", String(rateLimit.remaining));

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
    ctx.set("Retry-After", String(retryAfter));

    strapi.log.warn(
      `Upload rate limit exceeded for ${isAuthenticated ? `user ${userId}` : "anonymous"} from IP ${clientIp}`
    );

    return ctx.tooManyRequests("Too many upload requests. Please try again later.");
  }

  // Allow the upload to proceed
  return true;
};
