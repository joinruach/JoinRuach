/**
 * media-item controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::media-item.media-item', ({ strapi }) => ({
  async incrementView(ctx) {
    const idParam = ctx.params.id;
    const id = Number.parseInt(idParam, 10);

    if (!Number.isFinite(id)) {
      ctx.throw(400, 'Invalid media item id');
      return;
    }

    // Rate limiting to prevent view count manipulation
    // Limit: 10 views per media item per IP per hour
    const { rateLimiter } = require('../../../services/rate-limiter');
    const clientIp = rateLimiter.getClientIp(ctx);
    const rateLimitKey = `media:view:${id}:${clientIp}`;
    const maxViewsPerHour = 10;
    const windowMs = 60 * 60 * 1000; // 1 hour

    const rateLimit = rateLimiter.check(rateLimitKey, maxViewsPerHour, windowMs);

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      ctx.set('Retry-After', String(retryAfter));
      ctx.set('X-RateLimit-Limit', String(maxViewsPerHour));
      ctx.set('X-RateLimit-Remaining', '0');
      strapi.log.warn(`View count rate limit exceeded for media ${id} from IP ${clientIp}`);
      return ctx.tooManyRequests('Too many view requests. Please try again later.');
    }

    // Set rate limit headers
    ctx.set('X-RateLimit-Limit', String(maxViewsPerHour));
    ctx.set('X-RateLimit-Remaining', String(rateLimit.remaining));

    const item = await strapi.entityService.findOne('api::media-item.media-item', id, {
      fields: ['id', 'views'],
    });

    if (!item) {
      ctx.notFound('Media item not found');
      return;
    }

    const updated = await strapi.entityService.update('api::media-item.media-item', id, {
      data: {
        views: (item.views || 0) + 1,
      } as any,
      fields: ['id', 'views'],
    });

    ctx.body = {
      id: updated.id,
      views: updated.views,
    };
  },
}));
