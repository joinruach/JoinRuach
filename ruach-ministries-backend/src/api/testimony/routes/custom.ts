/**
 * Custom testimony routes for public form submission
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/testimonies/submit',
      handler: 'testimony.submit',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
