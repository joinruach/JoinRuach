export default {
  routes: [
    {
      method: 'POST',
      path: '/videos/upload',
      handler: 'video.upload',
      config: {
        auth: true,
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [],
      },
    },
  ],
};
