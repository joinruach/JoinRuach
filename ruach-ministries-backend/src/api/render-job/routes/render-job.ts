/**
 * Phase 13: Render Job Routes
 *
 * Custom routes for render job operations
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/render-jobs/trigger',
      handler: 'render-job-controller.trigger',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/render-jobs/:jobId',
      handler: 'render-job-controller.get',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/render-jobs/session/:sessionId',
      handler: 'render-job-controller.getBySession',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/render-jobs/:jobId/retry',
      handler: 'render-job-controller.retry',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/render-jobs/:jobId/cancel',
      handler: 'render-job-controller.cancel',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
