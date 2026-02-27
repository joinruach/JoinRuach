/**
 * Formation Engine API Routes
 *
 * Auth: All routes require authentication.
 * Mutations (emit-event, recompute) require studio operator role.
 * Reads (state, can-access, queue-stats) require any authenticated user.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/formation/emit-event',
      handler: 'formation-engine.emitEvent',
      config: {
        policies: ['global::is-authenticated-or-admin'],
      },
    },
    {
      method: 'GET',
      path: '/formation/state/:userId',
      handler: 'formation-engine.getState',
      config: {
        policies: ['global::is-authenticated-or-admin'],
      },
    },
    {
      method: 'POST',
      path: '/formation/recompute/:userId',
      handler: 'formation-engine.recomputeState',
      config: {
        policies: ['global::require-studio-operator'],
      },
    },
    {
      method: 'GET',
      path: '/formation/can-access/:nodeId',
      handler: 'formation-engine.checkAccess',
      config: {
        policies: ['global::is-authenticated-or-admin'],
      },
    },
    {
      method: 'GET',
      path: '/formation/queue-stats',
      handler: 'formation-engine.getQueueStats',
      config: {
        policies: ['global::require-studio-operator'],
      },
    },
  ],
};
