/**
 * Phase 11: EDL Routes
 *
 * Custom routes for EDL generation and workflow management
 * Auth: All routes require authentication.
 * Mutations (POST/PUT) require studio operator role.
 * Reads (GET) require any authenticated user.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/compute',
      handler: 'edl-controller.compute',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/generate',
      handler: 'edl-controller.compute',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/edl',
      handler: 'edl-controller.get',
      config: {
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/recording-sessions/:id/edl',
      handler: 'edl-controller.update',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/recording-sessions/:id/edl/chapters',
      handler: 'edl-controller.updateChapters',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/approve',
      handler: 'edl-controller.approve',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/lock',
      handler: 'edl-controller.lock',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/edl/export/:format',
      handler: 'edl-controller.export',
      config: {
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [],
      },
    },
  ],
};
