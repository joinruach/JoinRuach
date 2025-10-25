"use strict";

const { sanitize } = require("@strapi/utils");
const { tokenBlacklist } = require("../../../services/token-blacklist");
const { refreshTokenStore } = require("../../../services/refresh-token-store");
const { rateLimiter } = require("../../../services/rate-limiter");
const logger = require("../../../config/logger");

const sanitizeUser = async (user) =>
  sanitize.contentAPI.output(user, strapi.contentType("plugin::users-permissions.user"));

// Token expiration times (in seconds)
const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

// Rate limiting configuration
const LOGIN_MAX_ATTEMPTS_IP = 5; // 5 attempts per IP per 15 minutes
const LOGIN_MAX_ATTEMPTS_USERNAME = 3; // 3 attempts per username per 15 minutes
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

module.exports = {
  async login(ctx) {
    const { identifier, password } = ctx.request.body;

    // Rate limiting by IP
    const clientIp = rateLimiter.getClientIp(ctx);
    const ipKey = `login:ip:${clientIp}`;
    const ipLimit = rateLimiter.check(ipKey, LOGIN_MAX_ATTEMPTS_IP, LOGIN_WINDOW_MS);

    if (!ipLimit.allowed) {
      const retryAfter = Math.ceil((ipLimit.resetAt - Date.now()) / 1000);
      ctx.set("Retry-After", String(retryAfter));
      logger.logSecurity('Login rate limit exceeded (IP)', {
        ip: clientIp,
        retryAfter,
        resetAt: new Date(ipLimit.resetAt).toISOString(),
      });
      return ctx.tooManyRequests("Too many login attempts. Please try again later.");
    }

    // Rate limiting by username/email
    const usernameKey = `login:user:${identifier}`;
    const usernameLimit = rateLimiter.check(usernameKey, LOGIN_MAX_ATTEMPTS_USERNAME, LOGIN_WINDOW_MS);

    if (!usernameLimit.allowed) {
      const retryAfter = Math.ceil((usernameLimit.resetAt - Date.now()) / 1000);
      ctx.set("Retry-After", String(retryAfter));
      logger.logSecurity('Login rate limit exceeded (Username)', {
        identifier,
        ip: clientIp,
        retryAfter,
        resetAt: new Date(usernameLimit.resetAt).toISOString(),
      });
      return ctx.tooManyRequests("Too many login attempts for this account. Please try again later.");
    }

    // Set rate limit headers
    ctx.set("X-RateLimit-Limit", String(LOGIN_MAX_ATTEMPTS_IP));
    ctx.set("X-RateLimit-Remaining", String(Math.min(ipLimit.remaining, usernameLimit.remaining)));

    try {
      const response = await strapi.plugins["users-permissions"].services.auth.callback(
        "local",
        { identifier, password }
      );

      if (!response.jwt) {
        return ctx.badRequest("Invalid credentials");
      }

      // On successful login, reset rate limits for this user
      rateLimiter.reset(usernameKey);

      // Generate access token with explicit expiration
      const accessToken = strapi.plugins["users-permissions"].services.jwt.issue(
        {
          id: response.user.id,
        },
        {
          expiresIn: ACCESS_TOKEN_EXPIRY
        }
      );

      // Generate refresh token with explicit expiration
      const refreshToken = strapi.plugins["users-permissions"].services.jwt.issue(
        {
          id: response.user.id,
          type: "refresh",
        },
        {
          expiresIn: REFRESH_TOKEN_EXPIRY
        }
      );

      // Store refresh token in the token store
      const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRY * 1000;
      refreshTokenStore.store(refreshToken, response.user.id, expiresAt);

      // Store refresh token in a secure, HttpOnly cookie
      ctx.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: REFRESH_TOKEN_EXPIRY * 1000,
      });

      const sanitizedUser = await sanitizeUser(response.user);

      logger.logAuth('Login successful', {
        userId: response.user.id,
        username: response.user.username,
        ip: clientIp,
      });

      return ctx.send({
        jwt: accessToken,
        user: sanitizedUser,
      });
    } catch (err) {
      logger.logAuth('Login failed', {
        identifier,
        ip: clientIp,
        error: err.message,
      });
      return ctx.badRequest("Invalid credentials");
    }
  },

  async refreshToken(ctx) {
    const oldRefreshToken = ctx.cookies.get("refreshToken");

    if (!oldRefreshToken) {
      return ctx.unauthorized("No refresh token provided");
    }

    try {
      // Verify the refresh token JWT signature
      const decoded = strapi.plugins["users-permissions"].services.jwt.verify(oldRefreshToken);

      if (decoded.type !== "refresh") {
        return ctx.unauthorized("Invalid token type");
      }

      // Check if token is blacklisted
      const tokenId = decoded.jti || oldRefreshToken.substring(0, 32);
      if (tokenBlacklist.isBlacklisted(tokenId)) {
        logger.logSecurity('Blacklisted token attempted', {
          userId: decoded.id,
          tokenId: tokenId.substring(0, 16),
        });
        return ctx.unauthorized("Token has been revoked");
      }

      // Validate and mark old token as used (rotation)
      const tokenData = refreshTokenStore.validate(oldRefreshToken);

      if (!tokenData) {
        // Token not found, expired, or already used
        return ctx.unauthorized("Invalid or expired refresh token");
      }

      // Verify user ID matches
      if (tokenData.userId !== decoded.id) {
        logger.logSecurity('User ID mismatch in refresh token', {
          tokenUserId: tokenData.userId,
          decodedUserId: decoded.id,
        });
        return ctx.unauthorized("Invalid token");
      }

      // Generate new access token
      const newAccessToken = strapi.plugins["users-permissions"].services.jwt.issue(
        {
          id: decoded.id,
        },
        {
          expiresIn: ACCESS_TOKEN_EXPIRY
        }
      );

      // Generate new refresh token (rotation)
      const newRefreshToken = strapi.plugins["users-permissions"].services.jwt.issue(
        {
          id: decoded.id,
          type: "refresh",
        },
        {
          expiresIn: REFRESH_TOKEN_EXPIRY
        }
      );

      // Store new refresh token
      const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRY * 1000;
      refreshTokenStore.store(newRefreshToken, decoded.id, expiresAt);

      // Update cookie with new refresh token
      ctx.cookies.set("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: REFRESH_TOKEN_EXPIRY * 1000,
      });

      logger.logAuth('Token refresh successful', {
        userId: decoded.id,
      });

      return ctx.send({
        jwt: newAccessToken
      });
    } catch (err) {
      logger.logAuth('Token refresh failed', {
        error: err.message,
      });
      return ctx.unauthorized("Invalid refresh token");
    }
  },

  async logout(ctx) {
    const refreshToken = ctx.cookies.get("refreshToken");

    try {
      if (refreshToken) {
        // Verify token to get user ID
        const decoded = strapi.plugins["users-permissions"].services.jwt.verify(refreshToken);

        // Add refresh token to blacklist
        const tokenId = decoded.jti || refreshToken.substring(0, 32);
        const expiresAt = (decoded.exp || Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY) * 1000;
        tokenBlacklist.add(tokenId, expiresAt);

        // Revoke refresh token from store
        refreshTokenStore.revoke(refreshToken);

        logger.logAuth('Logout successful', {
          userId: decoded.id,
        });
      }

      // Clear refresh token cookie
      ctx.cookies.set("refreshToken", null, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 0,
      });

      return ctx.send({
        message: "Logged out successfully"
      });
    } catch (err) {
      logger.logAuth('Logout error', {
        error: err.message,
      });

      // Still clear the cookie even if verification fails
      ctx.cookies.set("refreshToken", null, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 0,
      });

      return ctx.send({
        message: "Logged out successfully"
      });
    }
  },
};
