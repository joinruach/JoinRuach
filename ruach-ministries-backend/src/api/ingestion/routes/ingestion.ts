export default {
  routes: [
    {
      method: 'POST',
      path: '/ingestion/enqueue',
      handler: 'ingestion.enqueue',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/ingestion/versions',
      handler: 'ingestion.listVersions',
      config: {
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/ingestion/review',
      handler: 'ingestion.submitReview',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
