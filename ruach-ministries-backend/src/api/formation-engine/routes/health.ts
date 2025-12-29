/**
 * Health Check Routes
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/_health',
      handler: 'health.healthCheck',
      config: {
        auth: false, // Public endpoint for monitoring
        policies: [],
        middlewares: [],
      },
    },
  ],
};
