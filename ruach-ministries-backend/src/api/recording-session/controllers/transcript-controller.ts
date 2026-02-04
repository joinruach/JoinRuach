import type { Core } from '@strapi/strapi';

/**
 * Phase 10: Transcript Controller
 *
 * REST API endpoints for session transcription operations
 * Routes: /api/recording-sessions/:id/transcript
 */

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * POST /api/recording-sessions/:id/transcript/compute
   * Trigger transcription for a session
   */
  async compute(ctx: any) {
    const { id } = ctx.params;

    try {
      const transcriptService = strapi.service(
        'api::recording-session.transcript-service'
      ) as any;

      if (!transcriptService) {
        return ctx.badRequest('Transcript service not available');
      }

      const result = await transcriptService.transcribeSession(id);

      ctx.body = {
        success: true,
        data: result
      };
    } catch (error) {
      strapi.log.error('[transcript-controller] Compute failed:', error);
      ctx.badRequest(
        error instanceof Error ? error.message : 'Transcription computation failed'
      );
    }
  },

  /**
   * GET /api/recording-sessions/:id/transcript
   * Get transcript data for a session
   */
  async get(ctx: any) {
    const { id } = ctx.params;

    try {
      const transcriptService = strapi.service(
        'api::recording-session.transcript-service'
      ) as any;

      const result = await transcriptService.getTranscript(id);

      ctx.body = {
        success: true,
        data: result
      };
    } catch (error) {
      strapi.log.error('[transcript-controller] Get failed:', error);
      ctx.notFound(
        error instanceof Error ? error.message : 'Transcript not found'
      );
    }
  },

  /**
   * GET /api/recording-sessions/:id/transcript/srt/:camera
   * Download SRT subtitle file for a specific camera
   */
  async getSRT(ctx: any) {
    const { id, camera } = ctx.params;

    if (!camera) {
      return ctx.badRequest('Camera parameter is required');
    }

    try {
      const transcriptService = strapi.service(
        'api::recording-session.transcript-service'
      ) as any;

      const srtContent = await transcriptService.getSubtitle(id, camera, 'SRT');

      // Set headers for file download
      ctx.set('Content-Type', 'text/plain; charset=utf-8');
      ctx.set('Content-Disposition', `attachment; filename="session-${id}-camera-${camera}.srt"`);

      ctx.body = srtContent;
    } catch (error) {
      strapi.log.error('[transcript-controller] Get SRT failed:', error);
      ctx.notFound(
        error instanceof Error ? error.message : 'SRT subtitle not found'
      );
    }
  },

  /**
   * GET /api/recording-sessions/:id/transcript/vtt/:camera
   * Download VTT subtitle file for a specific camera
   */
  async getVTT(ctx: any) {
    const { id, camera } = ctx.params;

    if (!camera) {
      return ctx.badRequest('Camera parameter is required');
    }

    try {
      const transcriptService = strapi.service(
        'api::recording-session.transcript-service'
      ) as any;

      const vttContent = await transcriptService.getSubtitle(id, camera, 'VTT');

      // Set headers for file download
      ctx.set('Content-Type', 'text/vtt; charset=utf-8');
      ctx.set('Content-Disposition', `attachment; filename="session-${id}-camera-${camera}.vtt"`);

      ctx.body = vttContent;
    } catch (error) {
      strapi.log.error('[transcript-controller] Get VTT failed:', error);
      ctx.notFound(
        error instanceof Error ? error.message : 'VTT subtitle not found'
      );
    }
  }
});
