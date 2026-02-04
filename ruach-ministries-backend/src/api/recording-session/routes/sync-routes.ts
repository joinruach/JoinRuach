/**
 * Phase 9: Sync Routes
 *
 * Custom routes for session sync operations
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/recording-sessions/:id/sync/compute',
      handler: 'sync-controller.compute',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/sync',
      handler: 'sync-controller.get',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/sync/approve',
      handler: 'sync-controller.approve',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/sync/correct',
      handler: 'sync-controller.correct',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
