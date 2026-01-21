export default {
  routes: [
    {
      method: 'POST',
      path: '/ruach-generation/generate',
      handler: 'ruach-generation.generate',
      config: {
        auth: {
          scope: ['create'],
        },
      },
    },
    {
      method: 'GET',
      path: '/ruach-generation/templates',
      handler: 'ruach-generation.listTemplates',
      config: {
        auth: {
          scope: ['find'],
        },
      },
    },
    {
      method: 'GET',
      path: '/ruach-generation/templates/:templateId',
      handler: 'ruach-generation.getTemplate',
      config: {
        auth: {
          scope: ['find'],
        },
      },
    },
    {
      method: 'POST',
      path: '/ruach-generation/verify-citations/:nodeId',
      handler: 'ruach-generation.verifyCitations',
      config: {
        auth: {
          scope: ['update'],
        },
      },
    },
    {
      method: 'GET',
      path: '/ruach-generation/guardrails',
      handler: 'ruach-generation.listGuardrails',
      config: {
        auth: {
          scope: ['find'],
        },
      },
    },
    {
      method: 'POST',
      path: '/ruach-generation/check-guardrails',
      handler: 'ruach-generation.checkGuardrails',
      config: {
        auth: {
          scope: ['create'],
        },
      },
    },
    {
      method: 'POST',
      path: '/ruach-generation/initialize',
      handler: 'ruach-generation.initialize',
      config: {
        auth: {
          scope: ['admin'],
        },
      },
    },
  ],
};
