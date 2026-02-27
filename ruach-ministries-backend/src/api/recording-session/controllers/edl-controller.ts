import type { Core } from '@strapi/strapi';
import { generateFCPXML } from '../../../services/fcpxml-generator';
import {
  ComputeEDLRequestSchema,
  UpdateEDLRequestSchema,
  UpdateChaptersRequestSchema,
  ApproveEDLRequestSchema,
  LockEDLRequestSchema,
} from '../validators/edl-validators';
import { validateRequest } from '../../../utils/validate-request';

/**
 * Phase 11: EDL Controller
 *
 * REST API endpoints for EDL generation and workflow management
 * Routes: /api/recording-sessions/:id/edl
 */

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * POST /api/recording-sessions/:id/edl/compute
   * Generate EDL for a session
   */
  async compute(ctx: any) {
    const { id } = ctx.params;
    const options = validateRequest(ctx, ComputeEDLRequestSchema, ctx.request.body || {});
    if (!options) return;

    try {
      const edlService = strapi.service(
        'api::recording-session.edl-service'
      ) as any;

      if (!edlService) {
        return ctx.badRequest('EDL service not available');
      }

      const result = await edlService.computeEDL(id, options);

      ctx.body = {
        success: true,
        data: result
      };
    } catch (error) {
      strapi.log.error('[edl-controller] Compute failed:', error);
      ctx.badRequest(
        error instanceof Error ? error.message : 'EDL computation failed'
      );
    }
  },

  /**
   * GET /api/recording-sessions/:id/edl
   * Get EDL data for a session
   */
  async get(ctx: any) {
    const { id } = ctx.params;

    try {
      const edlService = strapi.service(
        'api::recording-session.edl-service'
      ) as any;

      const result = await edlService.getEDL(id);

      ctx.body = {
        success: true,
        data: result
      };
    } catch (error) {
      strapi.log.error('[edl-controller] Get failed:', error);
      ctx.notFound(
        error instanceof Error ? error.message : 'EDL not found'
      );
    }
  },

  /**
   * POST /api/recording-sessions/:id/edl/approve
   * Approve EDL for use
   */
  async approve(ctx: any) {
    const { id } = ctx.params;
    const data = validateRequest(ctx, ApproveEDLRequestSchema, ctx.request.body || {});
    if (!data) return;
    const { approvedBy, notes } = data;

    try {
      const edlService = strapi.service(
        'api::recording-session.edl-service'
      ) as any;

      const result = await edlService.approveEDL(id, approvedBy, notes);

      ctx.body = {
        success: true,
        message: 'EDL approved',
        data: result
      };
    } catch (error) {
      strapi.log.error('[edl-controller] Approve failed:', error);
      ctx.badRequest(
        error instanceof Error ? error.message : 'EDL approval failed'
      );
    }
  },

  /**
   * POST /api/recording-sessions/:id/edl/lock
   * Lock EDL for rendering (immutable)
   */
  async lock(ctx: any) {
    const { id } = ctx.params;
    const data = validateRequest(ctx, LockEDLRequestSchema, ctx.request.body || {});
    if (!data) return;
    const { lockedBy, notes } = data;

    try {
      const edlService = strapi.service(
        'api::recording-session.edl-service'
      ) as any;

      const result = await edlService.lockEDL(id, lockedBy, notes);

      ctx.body = {
        success: true,
        message: 'EDL locked for rendering',
        data: result
      };
    } catch (error) {
      strapi.log.error('[edl-controller] Lock failed:', error);

      // Check if error is about non-approved EDL
      if (error instanceof Error && error.message.includes('must be approved')) {
        ctx.forbidden(error.message);
      } else {
        ctx.badRequest(
          error instanceof Error ? error.message : 'EDL lock failed'
        );
      }
    }
  },

  /**
   * PUT /api/recording-sessions/:id/edl
   * Update EDL cuts
   */
  async update(ctx: any) {
    const { id } = ctx.params;
    const updateData = validateRequest(ctx, UpdateEDLRequestSchema, ctx.request.body || {});
    if (!updateData) return;
    const { cuts } = updateData;

    try {
      const edlService = strapi.service(
        'api::recording-session.edl-service'
      ) as any;

      const result = await edlService.updateCuts(id, cuts);

      ctx.body = {
        success: true,
        message: 'EDL updated',
        data: result
      };
    } catch (error) {
      strapi.log.error('[edl-controller] Update failed:', error);
      ctx.badRequest(
        error instanceof Error ? error.message : 'EDL update failed'
      );
    }
  },

  /**
   * PUT /api/recording-sessions/:id/edl/chapters
   * Update EDL chapters
   */
  async updateChapters(ctx: any) {
    const { id } = ctx.params;
    const chaptersData = validateRequest(ctx, UpdateChaptersRequestSchema, ctx.request.body || {});
    if (!chaptersData) return;
    const { chapters } = chaptersData;

    try {
      const edlService = strapi.service(
        'api::recording-session.edl-service'
      ) as any;

      const result = await edlService.updateChapters(id, chapters);

      ctx.body = {
        success: true,
        message: 'Chapters updated',
        data: result
      };
    } catch (error) {
      strapi.log.error('[edl-controller] Update chapters failed:', error);
      ctx.badRequest(
        error instanceof Error ? error.message : 'Chapters update failed'
      );
    }
  },

  /**
   * GET /api/recording-sessions/:id/edl/export/:format
   * Export EDL to different formats
   */
  async export(ctx: any) {
    const { id, format } = ctx.params;

    try {
      const edlService = strapi.service(
        'api::recording-session.edl-service'
      ) as any;

      const edlData = await edlService.getEDL(id);

      // Export based on format
      let content: string;
      let filename: string;
      let contentType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(edlData.canonicalEdl, null, 2);
          filename = `session-${id}.json`;
          contentType = 'application/json';
          break;

        case 'fcpxml': {
          const sessionTitle = edlData.session?.title || `Session ${id}`;
          content = generateFCPXML(edlData.canonicalEdl, sessionTitle);
          filename = `session-${id}.fcpxml`;
          contentType = 'application/xml';
          break;
        }

        default:
          return ctx.badRequest(`Unsupported export format: ${format}`);
      }

      ctx.set('Content-Disposition', `attachment; filename="${filename}"`);
      ctx.set('Content-Type', contentType);
      ctx.body = content;
    } catch (error) {
      strapi.log.error('[edl-controller] Export failed:', error);
      ctx.badRequest(
        error instanceof Error ? error.message : 'EDL export failed'
      );
    }
  }
});
