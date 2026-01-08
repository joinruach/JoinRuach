export default {
  routes: [
    // Standard CRUD routes
    { method: 'GET', path: '/library-documents', handler: 'library-document.find' },
    { method: 'GET', path: '/library-documents/:id', handler: 'library-document.findOne' },
    { method: 'POST', path: '/library-documents', handler: 'library-document.create' },
    { method: 'PUT', path: '/library-documents/:id', handler: 'library-document.update' },
    { method: 'DELETE', path: '/library-documents/:id', handler: 'library-document.delete' },

    // Custom search endpoint
    {
      method: 'POST',
      path: '/library-documents/search',
      handler: 'library-document.search',
      config: {
        auth: false, // Public endpoint - no auth required
        policies: [],
        middlewares: [],
      },
    },
  ],
};
