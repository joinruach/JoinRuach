export default {
  routes: [
    {
      method: "POST",
      path: "/library/search",
      handler: "library.search",
      config: {
        auth: {
          scope: ["find"],
        },
      },
    },
    {
      method: "GET",
      path: "/library/sources",
      handler: "library.getSources",
      config: {
        auth: {
          scope: ["find"],
        },
      },
    },
    {
      method: "GET",
      path: "/library/sources/:sourceId",
      handler: "library.getSourceById",
      config: {
        auth: {
          scope: ["find"],
        },
      },
    },
    {
      method: "GET",
      path: "/library/status/:versionId",
      handler: "library.getStatus",
      config: {
        auth: {
          scope: ["find"],
        },
      },
    },
    {
      method: "POST",
      path: "/library/ingest",
      handler: "library.triggerIngestion",
      config: {
        auth: {
          scope: ["create"],
        },
      },
    },
  ],
};
