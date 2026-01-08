export default {
  routes: [
    {
      method: 'GET',
      path: '/library-license-policies',
      handler: 'library-license-policy.find',
    },
    {
      method: 'GET',
      path: '/library-license-policies/:id',
      handler: 'library-license-policy.findOne',
    },
    {
      method: 'POST',
      path: '/library-license-policies',
      handler: 'library-license-policy.create',
    },
    {
      method: 'PUT',
      path: '/library-license-policies/:id',
      handler: 'library-license-policy.update',
    },
    {
      method: 'DELETE',
      path: '/library-license-policies/:id',
      handler: 'library-license-policy.delete',
    },
  ],
};
