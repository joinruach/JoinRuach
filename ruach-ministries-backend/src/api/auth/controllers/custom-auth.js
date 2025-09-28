"use strict";

const { sanitizeEntity } = require("@strapi/utils").default;

module.exports = {
  async login(ctx) {
    const { identifier, password } = ctx.request.body;

    const response = await strapi.plugins["users-permissions"].services.auth.callback(
      "local",
      { identifier, password }
    );

    if (!response.jwt) {
      return ctx.badRequest("Invalid credentials");
    }

    // Generate a refresh token (you can store it in the database for persistence)
    const refreshToken = strapi.plugins["users-permissions"].services.jwt.issue({
      id: response.user.id,
      type: "refresh",
    });

    // Store refresh token in a secure, HttpOnly cookie
    ctx.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week expiration
    });

    return ctx.send({
      jwt: response.jwt,
      user: sanitizeEntity(response.user, { model: strapi.models.user }),
    });
  },

  async refreshToken(ctx) {
    const refreshToken = ctx.cookies.get("refreshToken");

    if (!refreshToken) {
      return ctx.unauthorized("No refresh token provided");
    }

    try {
      // Verify the refresh token
      const decoded = strapi.plugins["users-permissions"].services.jwt.verify(refreshToken);
      if (decoded.type !== "refresh") {
        return ctx.unauthorized("Invalid token type");
      }

      // Generate a new access token
      const newAccessToken = strapi.plugins["users-permissions"].services.jwt.issue({
        id: decoded.id,
      });

      return ctx.send({ jwt: newAccessToken });
    } catch (err) {
      return ctx.unauthorized("Invalid refresh token");
    }
  },
};
