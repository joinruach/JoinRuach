import type { Core } from '@strapi/strapi';
import { registerReadOnlyLocks } from './utils/register-read-only-locks';
import { syncPublicPermissions } from './utils/sync-public-permissions';

export default {
  /**
   * Register lifecycle hooks and extensions before Strapi initializes.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    registerReadOnlyLocks(strapi);
  },

  /**
   * Normalize permissions once Strapi is ready.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await syncPublicPermissions(strapi);
  },
};
