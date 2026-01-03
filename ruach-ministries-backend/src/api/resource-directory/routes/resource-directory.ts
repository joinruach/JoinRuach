/**
 * resource-directory routes
 */

import { factories } from '@strapi/strapi';

const POLICY_NAME = 'global::require-access-level';
const CONTENT_TYPE = 'api::resource-directory.resource-directory';

const policyConfig = {
  name: POLICY_NAME,
  config: {
    contentType: CONTENT_TYPE,
    operation: 'find',
  },
};

export default factories.createCoreRouter('api::resource-directory.resource-directory', {
  only: ['find', 'update'],
  config: {
    find: {
      policies: [policyConfig],
    },
  },
});
