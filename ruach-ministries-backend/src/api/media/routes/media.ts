export default {
  routes: [
    {
      method: "GET",
      path: "/media/library",
      handler: "media.library",
      config: {
        auth: false,
      },
    },
  ],
};
