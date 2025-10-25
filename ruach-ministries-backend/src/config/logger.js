/**
 * Winston Structured Logging Configuration
 *
 * Provides centralized logging for the Strapi backend with:
 * - Structured JSON output for production
 * - Pretty-printed logs for development
 * - Multiple log levels (error, warn, info, debug)
 * - Request correlation IDs
 * - Logtail integration support
 */

const winston = require('winston');
const { format } = winston;

// Environment configuration
const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Logtail configuration (optional)
const LOGTAIL_SOURCE_TOKEN = process.env.LOGTAIL_SOURCE_TOKEN;

/**
 * Custom format for adding metadata
 */
const metadataFormat = format((info) => {
  info.environment = environment;
  info.service = 'ruach-backend';
  info.timestamp = new Date().toISOString();

  // Add request context if available
  if (info.req) {
    info.requestId = info.req.id || info.req.headers?.[`x-request-id`];
    info.ip = info.req.ip || info.req.headers?.[`x-forwarded-for`] || info.req.headers?.[`x-real-ip`];
    info.method = info.req.method;
    info.url = info.req.url;
    info.userAgent = info.req.headers?.[`user-agent`];
    delete info.req; // Remove circular reference
  }

  // Add user context if available
  if (info.user) {
    info.userId = info.user.id;
    info.username = info.user.username;
    delete info.user; // Remove sensitive data
  }

  return info;
});

/**
 * Create base formats
 */
const baseFormats = [
  format.errors({ stack: true }),
  metadataFormat(),
];

/**
 * Development format (pretty-printed)
 */
const developmentFormat = format.combine(
  ...baseFormats,
  format.colorize(),
  format.printf(({ level, message, timestamp, service, requestId, userId, stack, ...meta }) => {
    let log = `${timestamp} [${service}] ${level}: ${message}`;

    if (requestId) log += ` [reqId: ${requestId}]`;
    if (userId) log += ` [userId: ${userId}]`;

    // Add metadata if present
    const metaKeys = Object.keys(meta).filter(key => !['environment', 'service', 'timestamp'].includes(key));
    if (metaKeys.length > 0) {
      log += `\n  ${JSON.stringify(meta, null, 2)}`;
    }

    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

/**
 * Production format (JSON)
 */
const productionFormat = format.combine(
  ...baseFormats,
  format.json()
);

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: logLevel,
  format: isProduction ? productionFormat : developmentFormat,
  defaultMeta: {
    service: 'ruach-backend',
    environment,
  },
  transports: [
    // Console transport (always enabled)
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),

    // File transports for production
    ...(isProduction ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ] : []),
  ],
  exitOnError: false,
});

/**
 * Add Logtail transport if configured
 */
if (LOGTAIL_SOURCE_TOKEN) {
  try {
    const { Logtail } = require('@logtail/node');
    const { LogtailTransport } = require('@logtail/winston');

    const logtail = new Logtail(LOGTAIL_SOURCE_TOKEN);
    logger.add(new LogtailTransport(logtail));

    logger.info('Logtail integration enabled', { sourceToken: LOGTAIL_SOURCE_TOKEN.substring(0, 8) + '...' });
  } catch (error) {
    logger.warn('Logtail packages not installed. Install @logtail/node and @logtail/winston for log persistence.');
  }
}

/**
 * Helper methods for structured logging
 */

/**
 * Log authentication events
 */
logger.logAuth = (event, data = {}) => {
  logger.info(`Auth: ${event}`, {
    category: 'authentication',
    event,
    ...data,
  });
};

/**
 * Log security events
 */
logger.logSecurity = (event, data = {}) => {
  logger.warn(`Security: ${event}`, {
    category: 'security',
    event,
    ...data,
  });
};

/**
 * Log rate limiting events
 */
logger.logRateLimit = (event, data = {}) => {
  logger.warn(`Rate Limit: ${event}`, {
    category: 'rate_limit',
    event,
    ...data,
  });
};

/**
 * Log database events
 */
logger.logDatabase = (event, data = {}) => {
  logger.info(`Database: ${event}`, {
    category: 'database',
    event,
    ...data,
  });
};

/**
 * Log API requests
 */
logger.logRequest = (req, res, duration) => {
  const { method, url, ip } = req;
  const { statusCode } = res;

  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  logger.log(level, `${method} ${url} ${statusCode} ${duration}ms`, {
    category: 'request',
    method,
    url,
    statusCode,
    duration,
    ip,
    requestId: req.id,
  });
};

/**
 * Log application events
 */
logger.logApp = (event, data = {}) => {
  logger.info(`App: ${event}`, {
    category: 'application',
    event,
    ...data,
  });
};

/**
 * Create child logger with additional context
 */
logger.child = (context) => {
  return winston.createLogger({
    ...logger,
    defaultMeta: {
      ...logger.defaultMeta,
      ...context,
    },
  });
};

// Log startup
logger.logApp('Logger initialized', {
  level: logLevel,
  environment,
  logtailEnabled: !!LOGTAIL_SOURCE_TOKEN,
});

module.exports = logger;
