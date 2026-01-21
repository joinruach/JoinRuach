import type { Core } from '@strapi/strapi';
import { registerReadOnlyLocks } from './utils/register-read-only-locks';
import { syncPublicPermissions } from './utils/sync-public-permissions';
import { initializeDonationThankYouQueue } from "./services/donation-thankyou-queue";
import { initializeLibraryIngestionQueue } from "./services/library-ingestion-queue";
import { initializeUnifiedIngestionQueue } from "./services/unified-ingestion-queue";
import seedPromptTemplates from "../database/seeds/ruach-prompt-templates";

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
    await initializeDonationThankYouQueue({ strapi });
    await initializeLibraryIngestionQueue({ strapi });
    await initializeUnifiedIngestionQueue({ strapi });

    // Initialize Ruach Generation system
    await seedPromptTemplates(strapi);

    // Initialize guardrails
    const guardrailEngine = strapi.service('api::library.ruach-guardrail-engine');
    if (guardrailEngine) {
      await guardrailEngine.initializeStarterGuardrails();
    }
  },
};
