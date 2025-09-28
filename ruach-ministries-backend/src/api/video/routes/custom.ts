export default {
  routes: [
    {
      method: 'POST',
      path: '/videos/upload',
      handler: 'video.upload',
      config: {
        auth: false, // Make the route public if needed
        policies: [],
        middlewares: [],
      },
    },
  ],
};