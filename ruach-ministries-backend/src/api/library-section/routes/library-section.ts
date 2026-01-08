export default {
  routes: [
    { method: 'GET', path: '/library-sections', handler: 'library-section.find' },
    { method: 'GET', path: '/library-sections/:id', handler: 'library-section.findOne' },
    { method: 'POST', path: '/library-sections', handler: 'library-section.create' },
    { method: 'PUT', path: '/library-sections/:id', handler: 'library-section.update' },
    { method: 'DELETE', path: '/library-sections/:id', handler: 'library-section.delete' },
  ],
};
