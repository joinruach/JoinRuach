/**
 * Ruach Async Generation Routes
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/ruach-async-generation/queue',
      handler: 'ruach-async-generation.queue',
      config: {
        auth: {
          scope: ['create'],
        },
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/ruach-async-generation/status/:jobId',
      handler: 'ruach-async-generation.status',
      config: {
        auth: {
          scope: ['find'],
        },
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/ruach-async-generation/jobs/:jobId',
      handler: 'ruach-async-generation.cancel',
      config: {
        auth: {
          scope: ['delete'],
        },
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/ruach-async-generation/jobs',
      handler: 'ruach-async-generation.list',
      config: {
        auth: {
          scope: ['find'],
        },
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/ruach-async-generation/stats',
      handler: 'ruach-async-generation.stats',
      config: {
        auth: {
          scope: ['find'],
        },
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/ruach-async-generation/poll/:jobId',
      handler: 'ruach-async-generation.poll',
      config: {
        auth: {
          scope: ['find'],
        },
        policies: [],
        middlewares: [],
      },
    },
  ],
};
