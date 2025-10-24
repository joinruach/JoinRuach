"use strict";

const { sanitize } = require("@strapi/utils");
const { tokenBlacklist } = require("../../../services/token-blacklist");
const { refreshTokenStore } = require("../../../services/refresh-token-store");

const sanitizeUser = async (user) =>
  sanitize.contentAPI.output(user, strapi.contentType("plugin::users-permissions.user"));

// Token expiration times (in seconds)
const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

module.exports = {
  async login(ctx) {
    const { identifier, password } = ctx.request.body;

    try {
      const response = await strapi.plugins["users-permissions"].services.auth.callback(
        "local",
        { identifier, password }
      );

      if (!response.jwt) {
        return ctx.badRequest("Invalid credentials");
      }

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

      strapi.log.info(`User ${response.user.id} logged in successfully`);

      return ctx.send({
        jwt: accessToken,
        user: sanitizedUser,
      });
    } catch (err) {
      strapi.log.error("Login error:", err);
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
        strapi.log.warn(`Blacklisted refresh token attempted for user ${decoded.id}`);
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
        strapi.log.error("User ID mismatch in refresh token");
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

      strapi.log.info(`Tokens refreshed successfully for user ${decoded.id}`);

      return ctx.send({
        jwt: newAccessToken
      });
    } catch (err) {
      strapi.log.error("Refresh token error:", err);
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

        strapi.log.info(`User ${decoded.id} logged out successfully`);
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
      strapi.log.error("Logout error:", err);

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
