export default {
  routes: [
    { method: 'GET', path: '/library-citations', handler: 'library-citation.find' },
    { method: 'GET', path: '/library-citations/:id', handler: 'library-citation.findOne' },
    { method: 'POST', path: '/library-citations', handler: 'library-citation.create' },
    { method: 'PUT', path: '/library-citations/:id', handler: 'library-citation.update' },
    { method: 'DELETE', path: '/library-citations/:id', handler: 'library-citation.delete' },
  ],
};
