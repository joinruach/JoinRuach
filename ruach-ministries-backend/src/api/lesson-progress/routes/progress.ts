import { factories } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'GET',
      path: '/lessons/:lessonSlug/progress',
      handler: 'lesson-progress.lessonProgress',
      config: {
        auth: {
          scope: [],
        },
        policies: ['global::is-authenticated-or-admin'],
      },
    },
    {
      method: 'POST',
      path: '/lessons/:lessonSlug/progress',
      handler: 'lesson-progress.upsertLessonProgress',
      config: {
        auth: {
          scope: [],
        },
        policies: ['global::is-authenticated-or-admin'],
      },
    },
    {
      method: 'GET',
      path: '/courses/:courseSlug/progress',
      handler: 'lesson-progress.courseProgress',
      config: {
        auth: {
          scope: [],
        },
        policies: ['global::is-authenticated-or-admin'],
      },
    },
  ],
};
