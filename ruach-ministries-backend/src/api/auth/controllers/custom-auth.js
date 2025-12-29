"use strict";

const _ = require("lodash");
const { sanitize } = require("@strapi/utils");
const { tokenBlacklist } = require("../../../services/token-blacklist");
const { refreshTokenStore } = require("../../../services/refresh-token-store");
const { rateLimiter } = require("../../../services/rate-limiter");
const logger = require("../../../config/logger");

const sanitizeUser = async (user, ctx) => {
  if (!user) {
    return null;
  }

  const apiSanitizers = sanitize.createAPISanitizers({
    getModel: strapi.getModel.bind(strapi),
  });

  return apiSanitizers.output(
    user,
    strapi.contentType("plugin::users-permissions.user"),
    { auth: ctx?.state?.auth }
  );
};

const getUsersPermissionsPlugin = () => strapi.plugin("users-permissions");
const getJwtService = () => getUsersPermissionsPlugin()?.service("jwt");
const getUserService = () => getUsersPermissionsPlugin()?.service("user");

// Token expiration times (in seconds)
const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

// Rate limiting configuration
const LOGIN_MAX_ATTEMPTS_IP = 5; // 5 attempts per IP per 15 minutes
const LOGIN_MAX_ATTEMPTS_USERNAME = 3; // 3 attempts per username per 15 minutes
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Cookie security configuration
// COOKIE_SECURE env var takes precedence, otherwise check NODE_ENV
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : process.env.NODE_ENV === "production";

// Validate secure cookie configuration in production
if (process.env.NODE_ENV === "production" && !COOKIE_SECURE) {
  logger.logSecurity("WARNING: Refresh tokens will be sent over HTTP in production! Set COOKIE_SECURE=true", {
    NODE_ENV: process.env.NODE_ENV,
    COOKIE_SECURE: process.env.COOKIE_SECURE,
  });
}

module.exports = {
  async login(ctx) {
    const { identifier, password } = ctx.request.body;

    // Rate limiting by IP
    const clientIp = rateLimiter.getClientIp(ctx);
    const ipKey = `login:ip:${clientIp}`;
    const ipLimit = await rateLimiter.check(ipKey, LOGIN_MAX_ATTEMPTS_IP, LOGIN_WINDOW_MS);

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
    const usernameLimit = await rateLimiter.check(usernameKey, LOGIN_MAX_ATTEMPTS_USERNAME, LOGIN_WINDOW_MS);

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
      const normalizedIdentifier =
        typeof identifier === "string" ? identifier.trim() : "";
      const normalizedPassword =
        typeof password === "string" ? password : "";

      if (!normalizedIdentifier || !normalizedPassword) {
        return ctx.badRequest("Identifier and password are required");
      }

      const jwtService = getJwtService();
      const userService = getUserService();

      if (!jwtService || !userService) {
        logger.logAuth('Login failed', {
          identifier,
          ip: clientIp,
          error: "jwt-service-unavailable",
        });
        return ctx.badRequest("Authentication service unavailable");
      }

      const pluginStore = strapi.store({ type: "plugin", name: "users-permissions" });
      const grantSettings = (await pluginStore.get({ key: "grant" })) || {};

      if (!_.get(grantSettings, ["email", "enabled"], false)) {
        logger.logAuth('Login failed', {
          identifier,
          ip: clientIp,
          error: "local-provider-disabled",
        });
        return ctx.badRequest("Authentication provider disabled");
      }

      const user = await strapi.db.query("plugin::users-permissions.user").findOne({
        where: {
          provider: "local",
          $or: [
            { email: normalizedIdentifier.toLowerCase() },
            { username: normalizedIdentifier },
          ],
        },
      });

      if (!user || !user.password) {
        throw new Error("Invalid credentials");
      }

      const validPassword = await userService.validatePassword(
        normalizedPassword,
        user.password
      );

      if (!validPassword) {
        throw new Error("Invalid credentials");
      }

      const advancedSettings = (await pluginStore.get({ key: "advanced" })) || {};
      const requiresConfirmation = _.get(advancedSettings, "email_confirmation", false);

      if (requiresConfirmation && user.confirmed !== true) {
        throw new Error("Your account email is not confirmed");
      }

      if (user.blocked === true) {
        throw new Error("Your account has been blocked by an administrator");
      }

      const loginTimestamp = new Date();
      await strapi.db.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: { lastLoginAt: loginTimestamp },
      });

      const sanitizedUser = await sanitizeUser(
        {
          ...user,
          lastLoginAt: loginTimestamp,
        },
        ctx
      );

      const lastLoginDate = (value) => {
        if (!value) {
          return new Date();
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
      };

      const userWithLoginAt = {
        ...sanitizedUser,
        lastLoginAt: lastLoginDate(loginTimestamp).toISOString(),
      };

      const accessToken = jwtService.issue(
        { id: user.id },
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      const refreshToken = jwtService.issue(
        { id: user.id, type: "refresh" },
        { expiresIn: REFRESH_TOKEN_EXPIRY }
      );

      const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRY * 1000;
      await refreshTokenStore.store(refreshToken, user.id, expiresAt);

      ctx.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: "Strict",
        maxAge: REFRESH_TOKEN_EXPIRY * 1000,
      });

      await rateLimiter.reset(usernameKey);

      logger.logAuth('Login successful', {
        userId: user.id,
        username: user.username,
        ip: clientIp,
      });

      return ctx.send({
        jwt: accessToken,
        user: userWithLoginAt,
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
      const jwtService = getJwtService();

      if (!jwtService) {
        throw new Error("JWT service unavailable");
      }

      const decoded = jwtService.verify(oldRefreshToken);

      if (decoded.type !== "refresh") {
        return ctx.unauthorized("Invalid token type");
      }

      // Check if token is blacklisted
      const tokenId = decoded.jti || oldRefreshToken.substring(0, 32);
      const isBlacklisted = await tokenBlacklist.isBlacklisted(tokenId);
      if (isBlacklisted) {
        logger.logSecurity('Blacklisted token attempted', {
          userId: decoded.id,
          tokenId: tokenId.substring(0, 16),
        });
        return ctx.unauthorized("Token has been revoked");
      }

      // Validate and mark old token as used (rotation)
      const tokenData = await refreshTokenStore.validate(oldRefreshToken);

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
      const newAccessToken = jwtService.issue(
        {
          id: decoded.id,
        },
        {
          expiresIn: ACCESS_TOKEN_EXPIRY
        }
      );

      // Generate new refresh token (rotation)
      const newRefreshToken = jwtService.issue(
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
      await refreshTokenStore.store(newRefreshToken, decoded.id, expiresAt);

      // Update cookie with new refresh token
      ctx.cookies.set("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
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
        const jwtService = getJwtService();

        if (!jwtService) {
          throw new Error("JWT service unavailable");
        }

        const decoded = jwtService.verify(refreshToken);

        // Add refresh token to blacklist
        const tokenId = decoded.jti || refreshToken.substring(0, 32);
        const expiresAt = (decoded.exp || Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY) * 1000;
        await tokenBlacklist.add(tokenId, expiresAt);

        // Revoke refresh token from store
        await refreshTokenStore.revoke(refreshToken);

        logger.logAuth('Logout successful', {
          userId: decoded.id,
        });
      }

      // Clear refresh token cookie
      ctx.cookies.set("refreshToken", null, {
        httpOnly: true,
        secure: COOKIE_SECURE,
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
        secure: COOKIE_SECURE,
        sameSite: "Strict",
        maxAge: 0,
      });

      return ctx.send({
        message: "Logged out successfully"
      });
    }
  },
};
