export default {
  routes: [
    {
      method: 'POST',
      path: '/media-items/:id/view',
      handler: 'media-item.incrementView',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/media-items/:id/progress',
      handler: 'media-item.saveProgress',
    config: {
      auth: {
        scope: [],
      },
    },
    },
    {
      method: 'GET',
      path: '/media-items/:id/progress',
      handler: 'media-item.getProgress',
    config: {
      auth: {
        scope: [],
      },
    },
    },
  ],
};
