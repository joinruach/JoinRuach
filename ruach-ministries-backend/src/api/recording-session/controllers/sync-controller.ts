import type { Core } from "@strapi/strapi";

/**
 * Phase 9: Sync Controller
 *
 * REST API endpoints for session sync operations
 * Routes: /api/recording-sessions/:id/sync
 */

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * POST /api/recording-sessions/:id/sync/compute
   * Trigger sync analysis for a session
   */
  async compute(ctx: any) {
    const { id } = ctx.params;
    const { masterCamera } = ctx.request.body || {};

    try {
      const syncService = strapi.service(
        'api::recording-session.sync-service'
      ) as any;

      if (!syncService) {
        return ctx.badRequest('Sync service not available');
      }

      const result = await syncService.syncSession(id, masterCamera);

      ctx.body = {
        success: true,
        data: result
      };
    } catch (error) {
      strapi.log.error('[sync-controller] Compute failed:', error);
      ctx.badRequest(
        error instanceof Error ? error.message : 'Sync computation failed'
      );
    }
  },

  /**
   * GET /api/recording-sessions/:id/sync
   * Get sync results for a session
   */
  async get(ctx: any) {
    const { id } = ctx.params;

    try {
      const syncService = strapi.service(
        'api::recording-session.sync-service'
      ) as any;

      const result = await syncService.getSyncResults(id);

      ctx.body = {
        success: true,
        data: result
      };
    } catch (error) {
      strapi.log.error('[sync-controller] Get failed:', error);
      ctx.notFound(
        error instanceof Error ? error.message : 'Sync results not found'
      );
    }
  },

  /**
   * POST /api/recording-sessions/:id/sync/approve
   * Approve sync offsets
   */
  async approve(ctx: any) {
    const { id } = ctx.params;
    const { approvedBy, notes } = ctx.request.body || {};

    try {
      const syncService = strapi.service(
        'api::recording-session.sync-service'
      ) as any;

      const result = await syncService.approveSync(id, approvedBy, notes);

      ctx.body = {
        success: true,
        message: 'Sync approved',
        data: result
      };
    } catch (error) {
      strapi.log.error('[sync-controller] Approve failed:', error);
      ctx.badRequest(
        error instanceof Error ? error.message : 'Sync approval failed'
      );
    }
  },

  /**
   * POST /api/recording-sessions/:id/sync/correct
   * Manually correct sync offsets
   */
  async correct(ctx: any) {
    const { id } = ctx.params;
    const { offsets, correctedBy, notes } = ctx.request.body || {};

    if (!offsets) {
      return ctx.badRequest('Missing required field: offsets');
    }

    try {
      const syncService = strapi.service(
        'api::recording-session.sync-service'
      ) as any;

      const result = await syncService.correctSync(
        id,
        offsets,
        correctedBy,
        notes
      );

      ctx.body = {
        success: true,
        message: 'Sync corrected',
        data: result
      };
    } catch (error) {
      strapi.log.error('[sync-controller] Correct failed:', error);
      ctx.badRequest(
        error instanceof Error ? error.message : 'Sync correction failed'
      );
    }
  }
});
