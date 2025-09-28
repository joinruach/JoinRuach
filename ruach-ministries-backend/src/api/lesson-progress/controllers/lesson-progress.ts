/**
 * lesson-progress controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lesson-progress.lesson-progress', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const body = ctx.request.body?.data ?? {};
    const courseSlug = body.courseSlug;
    const lessonSlug = body.lessonSlug;
    if (!courseSlug || !lessonSlug) {
      return ctx.badRequest('courseSlug and lessonSlug are required');
    }

    const payload = {
      courseSlug,
      lessonSlug,
      secondsWatched: body.secondsWatched ?? 0,
      completed: body.completed ?? false,
      user: user.id,
    };

    const existing = await strapi.db.query('api::lesson-progress.lesson-progress').findOne({
      where: {
        courseSlug,
        lessonSlug,
        user: user.id,
      },
    });

    ctx.request.body.data = payload;

    if (existing) {
      ctx.params = { ...(ctx.params || {}), id: existing.id };
      return await super.update(ctx);
    }

    return await super.create(ctx);
  },

  async find(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const incomingFilters = {
      ...(ctx.query?.filters as Record<string, unknown> | undefined),
    } as Record<string, unknown>;
    ctx.query = {
      ...ctx.query,
      filters: {
        ...incomingFilters,
        user: {
          id: {
            $eq: user.id,
          },
        },
      },
    };

    return await super.find(ctx);
  },
}));
