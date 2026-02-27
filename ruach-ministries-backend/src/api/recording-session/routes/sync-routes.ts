/**
 * Phase 9: Sync Routes
 *
 * Custom routes for session sync operations
 * Auth: All routes require authentication.
 * Mutations (POST) require studio operator role.
 * Reads (GET) require any authenticated user.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/recording-sessions/:id/sync/compute',
      handler: 'sync-controller.compute',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/sync',
      handler: 'sync-controller.get',
      config: {
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/sync/approve',
      handler: 'sync-controller.approve',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/sync/correct',
      handler: 'sync-controller.correct',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
  ],
};
