/**
 * media-item router
 */

import { factories } from '@strapi/strapi';

const POLICY_NAME = 'global::require-access-level';
const CONTENT_TYPE = 'api::media-item.media-item';

const policyConfig = (operation: 'find' | 'findOne') => ({
  name: POLICY_NAME,
  config: {
    contentType: CONTENT_TYPE,
    operation,
  },
});

export default factories.createCoreRouter('api::media-item.media-item', {
  config: {
    find: {
      policies: [policyConfig('find')],
    },
    findOne: {
      policies: [policyConfig('findOne')],
    },
  },
});
