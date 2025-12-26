/**
 * lesson-progress controller
 */

import { factories } from '@strapi/strapi';

type LessonProgressRequestData = {
  courseSlug?: string;
  lessonSlug?: string;
  secondsWatched?: number;
  completed?: boolean;
  user?: number | string;
};

type LessonProgressRequest = {
  request: {
    body?: {
      data?: LessonProgressRequestData;
    };
  };
};

export default factories.createCoreController('api::lesson-progress.lesson-progress', ({ strapi }) => ({
  async create(ctx) {
    const request = ctx.request as LessonProgressRequest['request'];
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const body = (request.body?.data ?? {}) as LessonProgressRequestData;
    const courseSlug = body.courseSlug;
    const lessonSlug = body.lessonSlug;
    if (!courseSlug || !lessonSlug) {
      return ctx.badRequest('courseSlug and lessonSlug are required');
    }

    const payload: LessonProgressRequestData = {
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

    request.body = request.body ?? {};
    request.body.data = payload;

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
