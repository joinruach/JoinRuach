/**
 * lesson-progress controller
 */

import { factories } from '@strapi/strapi';

type LessonProgressRequestData = {
  courseSlug?: string;
  lessonSlug?: string;
  secondsWatched?: number;
  duration?: number;
  progressPercent?: number;
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

const COMPLETE_THRESHOLD = 95;

function normalizeProgress(input: {
  secondsWatched?: number;
  progressPercent?: number;
  duration?: number;
}) {
  if (typeof input.progressPercent === 'number') {
    return Math.max(0, Math.min(100, Math.round(input.progressPercent)));
  }

  if (
    typeof input.secondsWatched === 'number' &&
    typeof input.duration === 'number' &&
    input.duration > 0
  ) {
    return Math.min(100, Math.round((input.secondsWatched / input.duration) * 100));
  }

  return 0;
}

function getRequestData(ctx: LessonProgressRequest['request']) {
  return (ctx.request.body?.data ?? ctx.request.body ?? {}) as LessonProgressRequestData;
}

function buildPayload({
  body,
  existing,
  lessonSlug,
  courseSlug,
  userId,
}: {
  body: LessonProgressRequestData;
  existing?: any;
  lessonSlug: string;
  courseSlug?: string;
  userId: number;
}) {
  const secondsWatched = Math.max(
    0,
    body.secondsWatched ?? existing?.secondsWatched ?? 0
  );
  const percent = normalizeProgress({
    progressPercent: body.progressPercent,
    secondsWatched,
    duration: body.duration,
  });
  const completedNow = percent >= COMPLETE_THRESHOLD;
  const completed =
    Boolean(existing?.completed) ||
    Boolean(body.completed) ||
    completedNow;

  const payload: LessonProgressRequestData = {
    courseSlug: courseSlug ?? body.courseSlug ?? existing?.courseSlug,
    lessonSlug,
    secondsWatched,
    progressPercent: percent,
    completed,
    user: userId,
  };

  if (completedNow && !existing?.completed) {
    payload.completedAt = new Date();
  } else if (existing?.completedAt) {
    payload.completedAt = existing.completedAt;
  }

  return payload;
}

async function findExistingProgress(strapi: any, lessonSlug: string, userId: number) {
  return await strapi.db.query('api::lesson-progress.lesson-progress').findOne({
    where: {
      lessonSlug,
      user: userId,
    },
  });
}

export default factories.createCoreController('api::lesson-progress.lesson-progress', ({ strapi }) => ({
  async create(ctx) {
    const request = ctx.request as LessonProgressRequest['request'];
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const body = getRequestData(request);
    const lessonSlug = body.lessonSlug;
    const courseSlug = body.courseSlug;
    if (!lessonSlug || !courseSlug) {
      return ctx.badRequest('lessonSlug and courseSlug are required');
    }

    const existing = await findExistingProgress(strapi, lessonSlug, user.id);
    const payload = buildPayload({
      body,
      existing,
      lessonSlug,
      courseSlug,
      userId: user.id,
    });

    if (!payload.courseSlug) {
      return ctx.badRequest('courseSlug is required');
    }

    ctx.request.body = ctx.request.body ?? {};
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

  async lessonProgress(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const lessonSlug = ctx.params.lessonSlug;
    if (!lessonSlug) {
      return ctx.badRequest('lessonSlug is required');
    }

    const record = await findExistingProgress(strapi, lessonSlug, user.id);
    if (!record) {
      return {
        lessonSlug,
        completed: false,
        progressPercent: 0,
        secondsWatched: 0,
      };
    }

    return {
      lessonSlug,
      completed: record.completed,
      progressPercent: record.progressPercent,
      secondsWatched: record.secondsWatched,
    };
  },

  async upsertLessonProgress(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const body = getRequestData(ctx.request);
    const lessonSlug = ctx.params.lessonSlug ?? body.lessonSlug;
    if (!lessonSlug) {
      return ctx.badRequest('lessonSlug is required');
    }

    const courseSlug = body.courseSlug;
    if (!courseSlug) {
      const existing = await findExistingProgress(strapi, lessonSlug, user.id);
      if (!existing?.courseSlug) {
        return ctx.badRequest('courseSlug is required');
      }
    }

    const existing = await findExistingProgress(strapi, lessonSlug, user.id);
    const payload = buildPayload({
      body,
      existing,
      lessonSlug,
      courseSlug:
        courseSlug ?? existing?.courseSlug ?? body.courseSlug,
      userId: user.id,
    });

    if (!payload.courseSlug) {
      return ctx.badRequest('courseSlug is required');
    }

    if (existing) {
      await strapi.db.query('api::lesson-progress.lesson-progress').update({
        where: { id: existing.id },
        data: payload,
      });
      return {
        lessonSlug,
        completed: payload.completed,
        progressPercent: payload.progressPercent,
        secondsWatched: payload.secondsWatched,
      };
    }

    const created = await strapi.db.query('api::lesson-progress.lesson-progress').create({
      data: payload,
    });

    return {
      lessonSlug,
      completed: created.completed,
      progressPercent: created.progressPercent,
      secondsWatched: created.secondsWatched,
    };
  },

  async courseProgress(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const courseSlug = ctx.params.courseSlug;
    if (!courseSlug) {
      return ctx.badRequest('courseSlug is required');
    }

    const lessons = await strapi.db.query('api::lesson.lesson').findMany({
      where: {
        course: {
          slug: courseSlug,
        },
      },
      select: ['slug'],
    });

    const progress = await strapi.db.query('api::lesson-progress.lesson-progress').findMany({
      where: {
        courseSlug,
        user: user.id,
      },
    });

    const completedLessons = progress.filter((p) => p.completed).length;
    const totalLessons = lessons.length;

    return {
      courseSlug,
      totalLessons,
      completedLessons,
      percentComplete: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };
  },
}));
