/**
 * Phase 13: Render Job Routes
 *
 * Custom routes for render job operations
 * Auth: All routes require authentication. Mutations require studio operator role.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/render-jobs/trigger',
      handler: 'render-job-controller.trigger',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/render-jobs/:jobId',
      handler: 'render-job-controller.get',
      config: {
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/render-jobs/session/:sessionId',
      handler: 'render-job-controller.getBySession',
      config: {
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/render-jobs/:jobId/retry',
      handler: 'render-job-controller.retry',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/render-jobs/:jobId/cancel',
      handler: 'render-job-controller.cancel',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
  ],
};
