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

    // TODO: replace with policy/token if public access becomes an issue
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
      },
      fields: ['id', 'views'],
    });

    ctx.body = {
      id: updated.id,
      views: updated.views,
    };
  },
}));
