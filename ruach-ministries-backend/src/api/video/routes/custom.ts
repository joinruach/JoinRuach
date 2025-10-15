export default {
  routes: [
    {
      method: 'POST',
      path: '/videos/upload',
      handler: 'video.upload',
      config: {
        auth: {
          scope: ['api::video.video.upload'],
        },
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [],
      },
    },
  ],
};
