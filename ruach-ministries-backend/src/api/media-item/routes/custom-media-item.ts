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
  ],
};
