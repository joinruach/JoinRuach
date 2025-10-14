import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::video.video', {
  config: {
    find: {
      auth: true,
      policies: ['global::is-authenticated-or-admin'],
      middlewares: [],
    },
    findOne: {
      auth: true,
      policies: ['global::is-authenticated-or-admin'],
      middlewares: [],
    },
    create: {
      auth: true,
      policies: ['global::is-authenticated-or-admin'],
      middlewares: [],
    },
    update: {
      auth: true,
      policies: ['global::is-authenticated-or-admin'],
      middlewares: [],
    },
    delete: {
      auth: true,
      policies: ['global::is-authenticated-or-admin'],
      middlewares: [],
    },
  },
});
