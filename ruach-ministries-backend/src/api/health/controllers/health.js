"use strict";

/**
 * Health Check Controller
 *
 * Provides health status endpoint for Docker healthcheck and load balancers.
 */

module.exports = {
  async check(ctx) {
    try {
      // Basic health check - verify Strapi is running
      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: strapi.config.get("info.strapi", "unknown"),
      };

      // Optional: Add database connectivity check
      try {
        await strapi.db.connection.raw("SELECT 1");
        health.database = "connected";
      } catch (dbError) {
        health.database = "disconnected";
        health.status = "degraded";
        strapi.log.error("Database health check failed:", dbError);
      }

      // Return appropriate status code
      const statusCode = health.status === "healthy" ? 200 : 503;

      return ctx.send(health, statusCode);
    } catch (error) {
      strapi.log.error("Health check failed:", error);

      return ctx.send(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          error: error.message,
        },
        503
      );
    }
  },
};
