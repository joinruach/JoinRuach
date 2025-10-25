/**
 * Request Logging Middleware
 *
 * Logs all HTTP requests with structured data including:
 * - Request method, URL, headers
 * - Response status code
 * - Request duration
 * - User context (if authenticated)
 * - Error details (if applicable)
 */

const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Add request ID for correlation
    ctx.request.id = ctx.headers['x-request-id'] || uuidv4();

    // Start timer
    const startTime = Date.now();

    // Add request context to logger
    const requestLogger = logger.child({
      requestId: ctx.request.id,
      ip: ctx.request.ip || ctx.request.headers['x-forwarded-for'] || ctx.request.headers['x-real-ip'],
    });

    // Attach logger to context for use in controllers
    ctx.logger = requestLogger;

    // Log incoming request (debug level)
    logger.debug(`→ ${ctx.method} ${ctx.url}`, {
      category: 'request',
      method: ctx.method,
      url: ctx.url,
      requestId: ctx.request.id,
      ip: ctx.request.ip,
      userAgent: ctx.headers['user-agent'],
    });

    try {
      await next();

      // Calculate duration
      const duration = Date.now() - startTime;

      // Determine log level based on status code
      const statusCode = ctx.status;
      let level = 'info';
      if (statusCode >= 500) level = 'error';
      else if (statusCode >= 400) level = 'warn';

      // Log response
      logger.log(level, `← ${ctx.method} ${ctx.url} ${statusCode} (${duration}ms)`, {
        category: 'request',
        method: ctx.method,
        url: ctx.url,
        statusCode,
        duration,
        requestId: ctx.request.id,
        ip: ctx.request.ip,
        userId: ctx.state.user?.id,
        username: ctx.state.user?.username,
      });
    } catch (error) {
      // Calculate duration
      const duration = Date.now() - startTime;

      // Log error
      logger.error(`✖ ${ctx.method} ${ctx.url} ERROR (${duration}ms)`, {
        category: 'request',
        method: ctx.method,
        url: ctx.url,
        duration,
        requestId: ctx.request.id,
        ip: ctx.request.ip,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          statusCode: error.status || error.statusCode,
        },
      });

      // Re-throw to let Strapi handle it
      throw error;
    }
  };
};
