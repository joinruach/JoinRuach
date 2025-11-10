/**
 * Presigned Upload Routes
 *
 * Custom routes for direct upload to R2 using presigned URLs
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/presigned-upload/generate',
      handler: 'presigned-upload.generate',
      config: {
        auth: false, // Allow unauthenticated access - consider enabling auth for production
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/presigned-upload/complete',
      handler: 'presigned-upload.complete',
      config: {
        auth: false, // Allow unauthenticated access - consider enabling auth for production
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/presigned-upload/config',
      handler: 'presigned-upload.config',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/presigned-upload',
      handler: 'presigned-upload.find',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/presigned-upload/:id',
      handler: 'presigned-upload.findOne',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/presigned-upload/:id',
      handler: 'presigned-upload.delete',
      config: {
        auth: false, // Consider enabling auth for production
        policies: [],
        middlewares: [],
      },
    },
  ],
};
