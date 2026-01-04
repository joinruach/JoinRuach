export default {
  routes: [
    {
      method: "GET",
      path: "/stripe/me",
      handler: "sync.me",
      config: {
        auth: {
          scope: [],
        },
        policies: ["global::is-authenticated-or-admin"],
      },
    },
    {
      method: "POST",
      path: "/stripe/sync-latest",
      handler: "sync.syncLatest",
      config: {
        auth: {
          scope: [],
        },
        policies: ["global::is-authenticated-or-admin"],
      },
    },
    {
      method: "POST",
      path: "/stripe/sync-customer",
      handler: "sync.syncCustomer",
      config: {
        auth: {
          scope: [],
        },
        policies: ["global::is-authenticated-or-admin"],
      },
    },
  ],
};
