import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::video.video', {
  config: {
    find: {
      auth: {
        scope: ['api::video.video.find'],
      },
      policies: ['global::is-authenticated-or-admin'],
      middlewares: [],
    },
    findOne: {
      auth: {
        scope: ['api::video.video.findOne'],
      },
      policies: ['global::is-authenticated-or-admin'],
      middlewares: [],
    },
    create: {
      auth: {
        scope: ['api::video.video.create'],
      },
      policies: ['global::is-authenticated-or-admin'],
      middlewares: [],
    },
    update: {
      auth: {
        scope: ['api::video.video.update'],
      },
      policies: ['global::is-authenticated-or-admin'],
      middlewares: [],
    },
    delete: {
      auth: {
        scope: ['api::video.video.delete'],
      },
      policies: ['global::is-authenticated-or-admin'],
      middlewares: [],
    },
  },
});
