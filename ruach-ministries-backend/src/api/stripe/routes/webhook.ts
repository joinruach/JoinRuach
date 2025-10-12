export default {
  routes: [
    {
      method: "POST",
      path: "/stripe/webhook",
      handler: "webhook.handle",
      config: {
        auth: false,
        body: {
          parser: {
            enabled: false,
          },
        },
      },
    },
  ],
};

