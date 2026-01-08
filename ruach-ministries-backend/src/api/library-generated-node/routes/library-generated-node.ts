export default {
  routes: [
    { method: 'GET', path: '/library-generated-nodes', handler: 'library-generated-node.find' },
    { method: 'GET', path: '/library-generated-nodes/:id', handler: 'library-generated-node.findOne' },
    { method: 'POST', path: '/library-generated-nodes', handler: 'library-generated-node.create' },
    { method: 'PUT', path: '/library-generated-nodes/:id', handler: 'library-generated-node.update' },
    { method: 'DELETE', path: '/library-generated-nodes/:id', handler: 'library-generated-node.delete' },
  ],
};
