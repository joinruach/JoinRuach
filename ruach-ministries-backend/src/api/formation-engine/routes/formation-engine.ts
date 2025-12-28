/**
 * Formation Engine API Routes
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/formation/emit-event',
      handler: 'formation-engine.emitEvent',
      config: {
        auth: false, // Allow anonymous users
      },
    },
    {
      method: 'GET',
      path: '/formation/state/:userId',
      handler: 'formation-engine.getState',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/formation/recompute/:userId',
      handler: 'formation-engine.recomputeState',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/formation/can-access/:nodeId',
      handler: 'formation-engine.checkAccess',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/formation/queue-stats',
      handler: 'formation-engine.getQueueStats',
      config: {
        auth: false,
      },
    },
  ],
};
