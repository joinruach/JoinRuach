export default {
  routes: [
    {
      method: 'POST',
      path: '/content-likes/toggle',
      handler: 'content-like.toggle',
      config: {
        policies: ['global::is-authenticated-or-admin'],
      },
    },
    {
      method: 'GET',
      path: '/content-likes/count/:contentType/:contentId',
      handler: 'content-like.count',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/content-likes/user',
      handler: 'content-like.userLikes',
      config: {
        policies: ['global::is-authenticated-or-admin'],
      },
    },
    {
      method: 'GET',
      path: '/content-likes/check/:contentType/:contentId',
      handler: 'content-like.check',
      config: {
        policies: ['global::is-authenticated-or-admin'],
      },
    },
  ],
};
