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
  completedAt?: Date | string;
  user?: number | string;
};

const COMPLETE_THRESHOLD = 95;

function resolveUserAttribute(strapi: any): { key: string; isRelation: boolean } {
  const contentType = strapi.contentTypes?.["api::lesson-progress.lesson-progress"];
  const attributes = contentType?.attributes ?? {};

  const candidates = ["user", "users_permissions_user"];
  for (const key of candidates) {
    if (key in attributes) {
      const attr = attributes[key];
      return { key, isRelation: attr?.type === "relation" };
    }
  }

  return { key: "user", isRelation: true };
}

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

function getRequestData(request: { body?: unknown }) {
  const body = request?.body as
    | { data?: LessonProgressRequestData }
    | LessonProgressRequestData
    | undefined;
  return (body && typeof body === "object" ? ((body as any).data ?? body) : {}) as LessonProgressRequestData;
}

function buildPayload({
  body,
  existing,
  lessonSlug,
  courseSlug,
  userId,
  userKey,
}: {
  body: LessonProgressRequestData;
  existing?: any;
  lessonSlug: string;
  courseSlug?: string;
  userId: number;
  userKey: string;
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
    [userKey]: userId,
  };

  if (completedNow && !existing?.completed) {
    payload.completedAt = new Date();
  } else if (existing?.completedAt) {
    payload.completedAt = existing.completedAt;
  }

  return payload;
}

async function findExistingProgress(
  strapi: any,
  lessonSlug: string,
  userId: number,
  userKey: string
) {
  return await strapi.db.query('api::lesson-progress.lesson-progress').findOne({
    where: {
      lessonSlug,
      [userKey]: userId,
    },
  });
}

export default factories.createCoreController('api::lesson-progress.lesson-progress', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const userAttr = resolveUserAttribute(strapi);
    const body = getRequestData(ctx.request);
    const lessonSlug = body.lessonSlug;
    const courseSlug = body.courseSlug;
    if (!lessonSlug || !courseSlug) {
      return ctx.badRequest('lessonSlug and courseSlug are required');
    }

    const existing = await findExistingProgress(strapi, lessonSlug, user.id, userAttr.key);
    const payload = buildPayload({
      body,
      existing,
      lessonSlug,
      courseSlug,
      userId: user.id,
      userKey: userAttr.key,
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

    const userAttr = resolveUserAttribute(strapi);
    const rawPageSize = (ctx.query?.pagination as any)?.pageSize ?? (ctx.query as any)?.["pagination[pageSize]"];
    const rawPage = (ctx.query?.pagination as any)?.page ?? (ctx.query as any)?.["pagination[page]"];
    const pageSize = Math.max(1, Math.min(100, Number(rawPageSize ?? 25) || 25));
    const page = Math.max(1, Number(rawPage ?? 1) || 1);

    const sortInput = Array.isArray(ctx.query?.sort) ? ctx.query?.sort[0] : (ctx.query?.sort as string | undefined);
    const sortValue = typeof sortInput === "string" && sortInput.length ? sortInput : "updatedAt:desc";
    const [sortField, sortOrder] = sortValue.split(":");
    const direction = sortOrder?.toLowerCase() === "asc" ? "asc" : "desc";

    const where = userAttr.isRelation
      ? { [userAttr.key]: user.id }
      : { [userAttr.key]: user.id };

    const total = await strapi.db.query("api::lesson-progress.lesson-progress").count({
      where,
    });

    const results = await strapi.db.query("api::lesson-progress.lesson-progress").findMany({
      where,
      orderBy: { [sortField || "updatedAt"]: direction },
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    ctx.status = 200;
    ctx.body = {
      data: results.map((entry: any) => {
        const { id, ...attributes } = entry ?? {};
        return { id, attributes };
      }),
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount,
          total,
        },
      },
    };
  },

  async lessonProgress(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const userAttr = resolveUserAttribute(strapi);
    const lessonSlug = ctx.params.lessonSlug;
    if (!lessonSlug) {
      return ctx.badRequest('lessonSlug is required');
    }

    const record = await findExistingProgress(strapi, lessonSlug, user.id, userAttr.key);
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

    const userAttr = resolveUserAttribute(strapi);
    const body = getRequestData(ctx.request);
    const lessonSlug = ctx.params.lessonSlug ?? body.lessonSlug;
    if (!lessonSlug) {
      return ctx.badRequest('lessonSlug is required');
    }

    const courseSlug = body.courseSlug;
    if (!courseSlug) {
      const existing = await findExistingProgress(strapi, lessonSlug, user.id, userAttr.key);
      if (!existing?.courseSlug) {
        return ctx.badRequest('courseSlug is required');
      }
    }

    const existing = await findExistingProgress(strapi, lessonSlug, user.id, userAttr.key);
    const payload = buildPayload({
      body,
      existing,
      lessonSlug,
      courseSlug:
        courseSlug ?? existing?.courseSlug ?? body.courseSlug,
      userId: user.id,
      userKey: userAttr.key,
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
