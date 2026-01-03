import { factories } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'GET',
      path: '/lessons/:lessonSlug/progress',
      handler: 'lesson-progress.lessonProgress',
      config: {
        auth: true,
      },
    },
    {
      method: 'POST',
      path: '/lessons/:lessonSlug/progress',
      handler: 'lesson-progress.upsertLessonProgress',
      config: {
        auth: true,
      },
    },
    {
      method: 'GET',
      path: '/courses/:courseSlug/progress',
      handler: 'lesson-progress.courseProgress',
      config: {
        auth: true,
      },
    },
  ],
};
