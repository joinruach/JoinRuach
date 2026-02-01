/**
 * Ruach Video Summarizer Controller
 * HTTP endpoints for video summarization
 */

import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Generate summary for a video
   * POST /api/ruach-video-summarizer/summarize
   */
  async summarize(ctx: any) {
    const { mediaId, transcript, title, segmentCount, includeScripture } = ctx.request.body;

    if (!mediaId) {
      return ctx.badRequest('Missing required field: mediaId');
    }

    try {
      const summarizerService = strapi.service('api::library.ruach-video-summarizer') as any;

      const summary = await summarizerService.summarizeVideo({
        mediaId,
        transcript,
        title,
        segmentCount: segmentCount || 5,
        includeScripture: includeScripture !== false,
      });

      return ctx.send({
        success: true,
        summary,
      });
    } catch (error: any) {
      strapi.log.error('Error summarizing video:', error);

      if (error.message.includes('No transcript')) {
        return ctx.badRequest(error.message);
      }

      return ctx.internalServerError('Failed to summarize video');
    }
  },

  /**
   * Get summary for a video
   * GET /api/ruach-video-summarizer/:mediaId
   */
  async get(ctx: any) {
    const { mediaId } = ctx.params;

    if (!mediaId) {
      return ctx.badRequest('Missing mediaId parameter');
    }

    try {
      const summarizerService = strapi.service('api::library.ruach-video-summarizer') as any;
      const summary = await summarizerService.getSummary(mediaId);

      if (!summary) {
        return ctx.notFound('Summary not found for this video');
      }

      return ctx.send(summary);
    } catch (error: any) {
      strapi.log.error('Error getting video summary:', error);
      return ctx.internalServerError('Failed to get video summary');
    }
  },

  /**
   * Get chapter markers for a video
   * GET /api/ruach-video-summarizer/:mediaId/chapters
   */
  async chapters(ctx: any) {
    const { mediaId } = ctx.params;

    if (!mediaId) {
      return ctx.badRequest('Missing mediaId parameter');
    }

    try {
      const summarizerService = strapi.service('api::library.ruach-video-summarizer') as any;
      const chapters = await summarizerService.generateChapterMarkers(mediaId);

      return ctx.send({ chapters });
    } catch (error: any) {
      strapi.log.error('Error getting chapter markers:', error);
      return ctx.internalServerError('Failed to get chapter markers');
    }
  },

  /**
   * Search within video summary
   * GET /api/ruach-video-summarizer/:mediaId/search
   */
  async search(ctx: any) {
    const { mediaId } = ctx.params;
    const { q } = ctx.query;

    if (!mediaId) {
      return ctx.badRequest('Missing mediaId parameter');
    }

    if (!q) {
      return ctx.badRequest('Missing query parameter: q');
    }

    try {
      const summarizerService = strapi.service('api::library.ruach-video-summarizer') as any;
      const results = await summarizerService.searchInSummary(mediaId, q);

      return ctx.send({
        query: q,
        results,
        count: results.length,
      });
    } catch (error: any) {
      strapi.log.error('Error searching video summary:', error);
      return ctx.internalServerError('Failed to search video summary');
    }
  },

  /**
   * Regenerate summary for a video
   * POST /api/ruach-video-summarizer/:mediaId/regenerate
   */
  async regenerate(ctx: any) {
    const { mediaId } = ctx.params;
    const { segmentCount, includeScripture } = ctx.request.body;

    if (!mediaId) {
      return ctx.badRequest('Missing mediaId parameter');
    }

    try {
      const summarizerService = strapi.service('api::library.ruach-video-summarizer') as any;

      const summary = await summarizerService.summarizeVideo({
        mediaId,
        segmentCount: segmentCount || 5,
        includeScripture: includeScripture !== false,
      });

      return ctx.send({
        success: true,
        summary,
      });
    } catch (error: any) {
      strapi.log.error('Error regenerating video summary:', error);
      return ctx.internalServerError('Failed to regenerate video summary');
    }
  },
});
