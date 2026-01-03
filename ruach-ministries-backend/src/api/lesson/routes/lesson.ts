/**
 * lesson router
 */

import { factories } from '@strapi/strapi';

const POLICY_NAME = 'global::require-access-level';
const CONTENT_TYPE = 'api::lesson.lesson';

const policyConfig = (operation: 'find' | 'findOne') => ({
  name: POLICY_NAME,
  config: {
    contentType: CONTENT_TYPE,
    operation,
  },
});

export default factories.createCoreRouter('api::lesson.lesson', {
  config: {
    find: {
      policies: [policyConfig('find')],
    },
    findOne: {
      policies: [policyConfig('findOne')],
    },
  },
});
