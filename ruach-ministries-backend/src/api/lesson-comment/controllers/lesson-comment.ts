/**
 * lesson-comment controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lesson-comment.lesson-comment', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const request = ctx.request as typeof ctx.request & {
      body?: { data?: Record<string, unknown> };
    };

    const body = request.body?.data ?? {};
    if (!body.courseSlug || !body.lessonSlug || !body.text) {
      return ctx.badRequest('courseSlug, lessonSlug and text are required');
    }

    if (!request.body) {
      request.body = { data: {} };
    }

    request.body.data = {
      ...body,
      user: user.id,
    };

    return await super.create(ctx);
  },

  async find(ctx) {
    const filters = {
      ...(ctx.query?.filters as Record<string, unknown> | undefined),
    } as Record<string, unknown> & { approved?: unknown };
    if (!('approved' in filters)) {
      filters.approved = { $eq: true };
    }
    ctx.query = {
      ...ctx.query,
      filters,
    };

    return await super.find(ctx);
  },
}));
