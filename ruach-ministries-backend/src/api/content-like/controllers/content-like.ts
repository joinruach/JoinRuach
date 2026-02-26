/**
 * Content Like Controller
 *
 * Handles HTTP layer for like toggle, count, and user-likes queries.
 */

const VALID_CONTENT_TYPES = ['media', 'course', 'series', 'event'];

export default {
  async toggle(ctx) {
    const { contentType, contentId } = ctx.request.body;

    if (!contentType || !contentId) {
      return ctx.badRequest('contentType and contentId are required');
    }

    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return ctx.badRequest(`contentType must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
    }

    const userId = ctx.state.user?.id;
    if (!userId) {
      return ctx.unauthorized('Authentication required');
    }

    const service = strapi.service('api::content-like.content-like');
    const result = await service.toggle(userId, contentType, contentId);

    return ctx.send(result);
  },

  async count(ctx) {
    const { contentType, contentId } = ctx.params;

    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return ctx.badRequest(`contentType must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
    }

    const service = strapi.service('api::content-like.content-like');
    const count = await service.count(contentType, contentId);

    return ctx.send({ count });
  },

  async check(ctx) {
    const { contentType, contentId } = ctx.params;
    const userId = ctx.state.user?.id;

    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return ctx.badRequest(`contentType must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
    }

    const service = strapi.service('api::content-like.content-like');
    const liked = await service.isLiked(userId, contentType, contentId);

    return ctx.send({ liked });
  },

  async userLikes(ctx) {
    const userId = ctx.state.user?.id;
    const { contentType } = ctx.query;

    if (contentType && !VALID_CONTENT_TYPES.includes(contentType as string)) {
      return ctx.badRequest(`contentType must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
    }

    const service = strapi.service('api::content-like.content-like');
    const likes = await service.getUserLikes(userId, contentType as string | undefined);

    return ctx.send({ likes });
  },
};
