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
    {
      method: "GET",
      path: "/media/debug",
      handler: "debug.debug",
      config: {
        auth: false,
      },
    },
  ],
};
