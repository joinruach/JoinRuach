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

let firstRequestLogged = false;

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Only enforce HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      const proto = ctx.request.get('x-forwarded-proto');
      const forwardedHost = ctx.request.get('x-forwarded-host');
      const forwardedFor = ctx.request.get('x-forwarded-for');
      const host = ctx.request.get('host');

      // Log first request for diagnostics
      if (!firstRequestLogged) {
        firstRequestLogged = true;
        strapi.log.info('🔍 First production request - Proxy headers diagnostic', {
          category: 'security',
          proxyConfig: {
            koa_proxy_enabled: strapi.config.get('server.proxy'),
            cookie_secure: process.env.COOKIE_SECURE,
          },
          headers: {
            'x-forwarded-proto': proto || 'MISSING',
            'x-forwarded-host': forwardedHost || 'MISSING',
            'x-forwarded-for': forwardedFor || 'MISSING',
            'host': host,
          },
          request: {
            protocol: ctx.request.protocol,
            secure: ctx.request.secure,
            url: ctx.request.url,
          },
        });
      }

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
        strapi.log.error('❌ Missing x-forwarded-proto header in production', {
          category: 'security',
          url: ctx.request.url,
          ip: ctx.request.ip,
          message: 'Reverse proxy not sending X-Forwarded-Proto header. Secure cookies will fail!',
          headers: {
            'x-forwarded-proto': 'MISSING',
            'x-forwarded-host': forwardedHost || 'MISSING',
            'x-forwarded-for': forwardedFor || 'MISSING',
          },
        });
      }

      // Validate that Koa is recognizing the secure connection
      if (proto === 'https' && !ctx.request.secure) {
        strapi.log.error('❌ Protocol mismatch: X-Forwarded-Proto is https but ctx.request.secure is false', {
          category: 'security',
          message: 'Koa proxy setting may be misconfigured. Check server.js proxy: true',
          request: {
            protocol: ctx.request.protocol,
            secure: ctx.request.secure,
            'x-forwarded-proto': proto,
          },
        });
      }
    }

    await next();
  };
};
