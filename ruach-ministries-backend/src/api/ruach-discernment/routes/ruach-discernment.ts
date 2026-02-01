export default {
  routes: [
    {
      method: 'POST',
      path: '/ruach-discernment/analyze',
      handler: 'ruach-discernment.analyze',
      config: {
        auth: {
          scope: ['admin'],
        },
      },
    },
    {
      method: 'GET',
      path: '/ruach-discernment/analyses',
      handler: 'ruach-discernment.listAnalyses',
      config: {
        auth: {
          scope: ['admin'],
        },
      },
    },
    {
      method: 'GET',
      path: '/ruach-discernment/analyses/:analysisId',
      handler: 'ruach-discernment.getAnalysis',
      config: {
        auth: {
          scope: ['admin'],
        },
      },
    },
    {
      method: 'PUT',
      path: '/ruach-discernment/analyses/:analysisId',
      handler: 'ruach-discernment.updateAnalysis',
      config: {
        auth: {
          scope: ['admin'],
        },
      },
    },
    {
      method: 'POST',
      path: '/ruach-discernment/analyses/:analysisId/publish',
      handler: 'ruach-discernment.publishAnalysis',
      config: {
        auth: {
          scope: ['admin'],
        },
      },
    },
    {
      method: 'POST',
      path: '/ruach-discernment/trend-report',
      handler: 'ruach-discernment.generateTrendReport',
      config: {
        auth: {
          scope: ['admin'],
        },
      },
    },
  ],
};
