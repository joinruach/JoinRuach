/**
 * HTTPS Enforcement Middleware
 *
 * Enforces HTTPS in production by checking the x-forwarded-proto header.
 * Redirects HTTP requests to HTTPS with a 301 permanent redirect.
 *
 * This provides application-layer HTTPS enforcement as a defense-in-depth measure,
 * even when reverse proxies (Nginx/Cloudflare) are configured correctly.
 */

'use strict';

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Only enforce HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      const proto = ctx.request.get('x-forwarded-proto');
      const host = ctx.request.get('host');

      // Check if request came over HTTP
      if (proto === 'http' && host) {
        const httpsUrl = `https://${host}${ctx.request.url}`;

        strapi.log.warn('HTTP request redirected to HTTPS', {
          category: 'security',
          originalUrl: `http://${host}${ctx.request.url}`,
          redirectUrl: httpsUrl,
          ip: ctx.request.ip,
        });

        // 301 Permanent Redirect to HTTPS
        ctx.status = 301;
        ctx.redirect(httpsUrl);
        return;
      }

      // Warn if x-forwarded-proto header is missing (misconfigured reverse proxy)
      if (!proto) {
        strapi.log.warn('Missing x-forwarded-proto header in production', {
          category: 'security',
          url: ctx.request.url,
          ip: ctx.request.ip,
          headers: ctx.request.headers,
        });
      }
    }

    await next();
  };
};
