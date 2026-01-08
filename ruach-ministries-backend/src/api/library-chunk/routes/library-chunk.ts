export default {
  routes: [
    { method: 'GET', path: '/library-chunks', handler: 'library-chunk.find' },
    { method: 'GET', path: '/library-chunks/:id', handler: 'library-chunk.findOne' },
    { method: 'POST', path: '/library-chunks', handler: 'library-chunk.create' },
    { method: 'PUT', path: '/library-chunks/:id', handler: 'library-chunk.update' },
    { method: 'DELETE', path: '/library-chunks/:id', handler: 'library-chunk.delete' },
  ],
};
