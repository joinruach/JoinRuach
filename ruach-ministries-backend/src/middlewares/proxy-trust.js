/**
 * Proxy Trust Middleware
 *
 * Enables Koa to trust X-Forwarded-* headers from reverse proxies.
 * MUST run before any other middleware that checks ctx.request.secure.
 *
 * This is critical for secure cookies to work behind DigitalOcean App Platform.
 */

'use strict';

module.exports = (config, { strapi }) => {
  // Set proxy trust on the Koa app instance
  if (strapi.server && strapi.server.app) {
    strapi.server.app.proxy = true;
    strapi.log.info('✅ [proxy-trust] Koa proxy trust enabled');
    strapi.log.info('   → X-Forwarded-* headers will be trusted');
    strapi.log.info('   → ctx.request.secure will reflect X-Forwarded-Proto');
  } else {
    strapi.log.error('❌ [proxy-trust] Failed to enable proxy trust - server.app not available');
  }

  // Return a no-op middleware (proxy setting is already applied above)
  return async (ctx, next) => {
    await next();
  };
};
