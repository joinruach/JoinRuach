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

  async saveProgress(ctx) {
    const idParam = ctx.params.id;
    const id = Number.parseInt(idParam, 10);

    if (!Number.isFinite(id)) {
      ctx.throw(400, 'Invalid media item id');
      return;
    }

    const user = ctx.state.user;
    if (!user) {
      ctx.throw(401, 'Authentication required');
      return;
    }

    const { currentTime, duration, completed } = ctx.request.body as {
      currentTime: number;
      duration?: number;
      completed?: boolean;
    };

    if (typeof currentTime !== 'number' || currentTime < 0) {
      ctx.throw(400, 'Invalid currentTime');
      return;
    }

    // Check if media item exists
    const mediaItem = await strapi.entityService.findOne('api::media-item.media-item', id, {
      fields: ['id'],
    });

    if (!mediaItem) {
      ctx.notFound('Media item not found');
      return;
    }

    // Find existing progress record
    const existingProgress = await strapi.entityService.findMany('api::media-progress.media-progress', {
      filters: {
        user: { id: user.id },
        mediaItem: { id },
      },
      limit: 1,
    });

    const progressData = {
      currentTime,
      duration: duration || 0,
      completed: completed || false,
      lastUpdated: new Date().toISOString(),
    };

    let progress;
    if (existingProgress && existingProgress.length > 0) {
      // Update existing progress
      progress = await strapi.entityService.update(
        'api::media-progress.media-progress',
        existingProgress[0].id,
        {
          data: progressData as any,
        }
      );
    } else {
      // Create new progress record
      progress = await strapi.entityService.create('api::media-progress.media-progress', {
        data: {
          ...progressData,
          user: user.id,
          mediaItem: id,
        } as any,
      });
    }

    ctx.body = {
      id: progress.id,
      currentTime: progress.currentTime,
      duration: progress.duration,
      completed: progress.completed,
      lastUpdated: progress.lastUpdated,
    };
  },

  async getProgress(ctx) {
    const idParam = ctx.params.id;
    const id = Number.parseInt(idParam, 10);

    if (!Number.isFinite(id)) {
      ctx.throw(400, 'Invalid media item id');
      return;
    }

    const user = ctx.state.user;
    if (!user) {
      ctx.throw(401, 'Authentication required');
      return;
    }

    // Find progress record
    const progressRecords = await strapi.entityService.findMany('api::media-progress.media-progress', {
      filters: {
        user: { id: user.id },
        mediaItem: { id },
      },
      limit: 1,
    });

    if (!progressRecords || progressRecords.length === 0) {
      ctx.body = {
        currentTime: 0,
        duration: 0,
        completed: false,
      };
      return;
    }

    const progress = progressRecords[0];
    ctx.body = {
      id: progress.id,
      currentTime: progress.currentTime,
      duration: progress.duration,
      completed: progress.completed,
      lastUpdated: progress.lastUpdated,
    };
  },
}));
