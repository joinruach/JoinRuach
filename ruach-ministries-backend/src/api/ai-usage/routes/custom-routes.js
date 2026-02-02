'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/ai-usages/daily/:userId',
      handler: 'ai-usage.dailySummary',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/ai-usages/tier-breakdown',
      handler: 'ai-usage.tierBreakdown',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
        middlewares: [],
      },
    },
  ],
};
