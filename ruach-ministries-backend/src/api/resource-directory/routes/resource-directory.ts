/**
 * resource-directory routes
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::resource-directory.resource-directory', {
  only: ['find', 'update'],
});
