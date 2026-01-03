export default {
  routes: [
    {
      method: "POST",
      path: "/stripe/sync-latest",
      handler: "sync.syncLatest",
      config: {
        auth: true,
      },
    },
    {
      method: "POST",
      path: "/stripe/sync-customer",
      handler: "sync.syncCustomer",
      config: {
        auth: true,
      },
    },
  ],
};
