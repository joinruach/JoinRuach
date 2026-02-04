/**
 * Phase 11: EDL Routes
 *
 * Custom routes for EDL generation and workflow management
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/compute',
      handler: 'edl-controller.compute',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/edl',
      handler: 'edl-controller.get',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/approve',
      handler: 'edl-controller.approve',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/lock',
      handler: 'edl-controller.lock',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
