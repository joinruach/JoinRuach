module.exports = {
  routes: [
    {
      method: "GET",
      path: "/_health",
      handler: "health.check",
      config: {
        policies: [],
        auth: false, // No authentication required for health checks
      },
    },
  ],
};
