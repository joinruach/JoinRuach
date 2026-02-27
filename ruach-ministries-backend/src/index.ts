import type { Core } from '@strapi/strapi';
import { registerReadOnlyLocks } from './utils/register-read-only-locks';
import { syncPublicPermissions } from './utils/sync-public-permissions';
import { initializeDonationThankYouQueue } from "./services/donation-thankyou-queue";
import { initializeLibraryIngestionQueue } from "./services/library-ingestion-queue";
import { initializeUnifiedIngestionQueue } from "./services/unified-ingestion-queue";
import { initializeMediaTranscodingQueue, shutdownMediaTranscodingQueue } from "./services/media-transcoding-queue";
import RenderWorker from './services/render-worker';
import { mountBullBoard } from './services/bull-board';
import seedPromptTemplates from "../database/seeds/ruach-prompt-templates";

// Import security services for initialization
const { redisClient } = require('./services/redis-client');
const { tokenBlacklist } = require('./services/token-blacklist');
const { refreshTokenStore } = require('./services/refresh-token-store');

export default {
  /**
   * Register lifecycle hooks and extensions before Strapi initializes.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    registerReadOnlyLocks(strapi);

    // Mount BullBoard queue dashboard
    mountBullBoard(strapi.server.app).catch((err) => {
      strapi.log.warn('[Register] BullBoard mount failed (non-fatal):', err);
    });
  },

  /**
   * Normalize permissions once Strapi is ready.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // ========================================
    // 1. Initialize Redis Connection (CRITICAL for multi-instance)
    // ========================================
    const redisConnected = await redisClient.connect();
    if (redisConnected) {
      strapi.log.info('[Bootstrap] ✅ Redis connected - token storage will persist across instances');
    } else {
      strapi.log.warn('[Bootstrap] ⚠️  Redis not available - using in-memory token storage (NOT SUITABLE FOR PRODUCTION SCALE)');
    }

    // ========================================
    // 2. Initialize Token Services
    // ========================================
    await tokenBlacklist.init();
    await refreshTokenStore.init();
    strapi.log.info('[Bootstrap] ✅ Token blacklist and refresh token store initialized');

    // ========================================
    // 3. Initialize Permissions
    // ========================================
    await syncPublicPermissions(strapi);

    // ========================================
    // 4. Initialize Job Queues
    // ========================================
    await initializeDonationThankYouQueue({ strapi });
    await initializeLibraryIngestionQueue({ strapi });
    await initializeUnifiedIngestionQueue({ strapi });
    await initializeMediaTranscodingQueue({ strapi });

    // Initialize async generation queue
    const asyncGenService = strapi.service('api::library.ruach-async-generation') as any;
    if (asyncGenService) {
      await asyncGenService.initialize();
      strapi.log.info('[Bootstrap] ✅ Async generation queue initialized');
    }

    // Initialize video render queue
    const videoRenderService = strapi.service('api::video-render.video-render') as any;
    if (videoRenderService) {
      await videoRenderService.initialize();
      strapi.log.info('[Bootstrap] ✅ Video render queue initialized');
    }

    // Start render worker (Phase 13)
    if (process.env.ENABLE_RENDER_WORKER !== 'false') {
      try {
        await RenderWorker.start(strapi);
        strapi.log.info('[Bootstrap] ✅ Render worker started');
      } catch (error) {
        strapi.log.error('[Bootstrap] Failed to start render worker:', error);
      }
    }

    // ========================================
    // 5. Initialize Ruach AI System
    // ========================================
    await seedPromptTemplates(strapi);

    // Initialize guardrails
    const guardrailEngine = strapi.service('api::library.ruach-guardrail-engine') as any;
    if (guardrailEngine) {
      await guardrailEngine.initializeStarterGuardrails();
      strapi.log.info('[Bootstrap] ✅ Ruach guardrails initialized');
    }

    // Initialize teaching voices
    const teachingVoiceService = strapi.service('api::library.ruach-teaching-voice') as any;
    if (teachingVoiceService) {
      await teachingVoiceService.initializeStarterVoices();
      strapi.log.info('[Bootstrap] ✅ Ruach teaching voices initialized');
    }

    // ========================================
    // 6. Environment Validation
    // ========================================
    const requiredEnvVars = ['JWT_SECRET', 'ADMIN_JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(key => !process.env[key]);

    if (missingVars.length > 0) {
      strapi.log.error(`[Bootstrap] ❌ Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Warn if API keys are missing (non-fatal)
    const apiKeyVars = ['CLAUDE_API_KEY', 'OPENAI_API_KEY'];
    const missingApiKeys = apiKeyVars.filter(key => !process.env[key]);
    if (missingApiKeys.length > 0) {
      strapi.log.warn(`[Bootstrap] ⚠️  Missing API keys (AI features may not work): ${missingApiKeys.join(', ')}`);
    }

    strapi.log.info('[Bootstrap] ✅ Ruach Ministries backend ready');
  },

  /**
   * Cleanup on shutdown
   */
  async destroy({ strapi }: { strapi: Core.Strapi }) {
    // Graceful shutdown of async generation queue
    const asyncGenService = strapi.service('api::library.ruach-async-generation') as any;
    if (asyncGenService?.shutdown) {
      await asyncGenService.shutdown();
    }

    // Shutdown media transcoding queue
    await shutdownMediaTranscodingQueue();

    // Stop render worker
    await RenderWorker.stop();

    // Disconnect Redis
    await redisClient.disconnect();
    strapi.log.info('[Shutdown] Ruach Ministries backend shutdown complete');
  },
};
