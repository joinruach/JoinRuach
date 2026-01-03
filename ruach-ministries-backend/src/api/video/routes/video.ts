import { factories } from '@strapi/strapi';

const POLICY_NAME = 'global::require-access-level';
const CONTENT_TYPE = 'api::video.video';

const requireAccessPolicy = (operation: 'find' | 'findOne') => ({
  name: POLICY_NAME,
  config: {
    contentType: CONTENT_TYPE,
    operation,
  },
});

export default factories.createCoreRouter('api::video.video', {
  config: {
    find: {
      auth: {
        scope: ['api::video.video.find'],
      },
      policies: ['global::is-authenticated-or-admin', requireAccessPolicy('find')],
      middlewares: [],
    },
    findOne: {
      auth: {
        scope: ['api::video.video.findOne'],
      },
      policies: ['global::is-authenticated-or-admin', requireAccessPolicy('findOne')],
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
