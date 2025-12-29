/**
 * Iron Chamber Controller
 * Handles API requests for margin reflections, insights, and living commentary
 * Delegates business logic to the iron-chamber service
 */

import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const service = () => strapi.service('api::iron-chamber.iron-chamber') as any;

  return {
    /**
     * Submit a margin reflection on a verse
     * POST /api/iron-chamber/margin-reflection
     */
    async submitMarginReflection(ctx: any) {
      try {
        const { verseId, content, userId, anonymousUserId } = ctx.request.body;

        if (!verseId || !content) {
          ctx.status = 400;
          ctx.body = { error: 'verseId and content are required' };
          return;
        }

        if (!userId && !anonymousUserId) {
          ctx.status = 400;
          ctx.body = { error: 'userId or anonymousUserId is required' };
          return;
        }

        const reflection = await service().createMarginReflection({
          verseId,
          content,
          userId,
          anonymousUserId,
        });

        ctx.status = 201;
        ctx.body = { data: reflection };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        strapi.log.error('[Iron Chamber] Error submitting margin reflection:', error);

        if (message.includes('not found')) {
          ctx.status = 404;
          ctx.body = { error: message };
        } else if (message.includes('permission')) {
          ctx.status = 403;
          ctx.body = { error: message };
        } else {
          ctx.status = 500;
          ctx.body = { error: 'Internal server error' };
        }
      }
    },

    /**
     * Get margin reflections for a verse
     * GET /api/iron-chamber/margin-reflections/:verseId
     */
    async getMarginReflections(ctx: any) {
      try {
        const { verseId } = ctx.params;
        const { limit, offset, sortBy } = ctx.query;

        const reflections = await service().getMarginReflectionsByVerse(verseId, {
          limit: limit ? parseInt(limit, 10) : undefined,
          offset: offset ? parseInt(offset, 10) : undefined,
          sortBy: sortBy || 'helpful',
        });

        ctx.status = 200;
        ctx.body = { data: reflections };
      } catch (error) {
        strapi.log.error('[Iron Chamber] Error getting margin reflections:', error);
        ctx.status = 500;
        ctx.body = { error: 'Internal server error' };
      }
    },

    /**
     * Get published iron insights
     * GET /api/iron-chamber/insights?theme=...&limit=20
     */
    async getInsights(ctx: any) {
      try {
        const { theme, verseId, limit, offset, sortBy } = ctx.query;

        const insights = await service().getInsights({
          theme,
          verseId,
          limit: limit ? parseInt(limit, 10) : undefined,
          offset: offset ? parseInt(offset, 10) : undefined,
          sortBy: sortBy || 'recent',
        });

        ctx.status = 200;
        ctx.body = { data: insights };
      } catch (error) {
        strapi.log.error('[Iron Chamber] Error getting insights:', error);
        ctx.status = 500;
        ctx.body = { error: 'Internal server error' };
      }
    },

    /**
     * Get a specific insight
     * GET /api/iron-chamber/insights/:insightId
     */
    async getInsight(ctx: any) {
      try {
        const { insightId } = ctx.params;

        const insight = await service().getInsightById(insightId);

        ctx.status = 200;
        ctx.body = { data: insight };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        strapi.log.error('[Iron Chamber] Error getting insight:', error);

        if (message.includes('not found')) {
          ctx.status = 404;
          ctx.body = { error: message };
        } else {
          ctx.status = 500;
          ctx.body = { error: 'Internal server error' };
        }
      }
    },

    /**
     * Vote on an insight
     * POST /api/iron-chamber/insights/:insightId/vote
     */
    async voteOnInsight(ctx: any) {
      try {
        const { insightId } = ctx.params;
        const { voteType, userId, comment } = ctx.request.body;

        if (!userId || !voteType) {
          ctx.status = 400;
          ctx.body = { error: 'userId and voteType are required' };
          return;
        }

        if (!['helpful', 'profound', 'needs_work'].includes(voteType)) {
          ctx.status = 400;
          ctx.body = { error: 'Invalid voteType. Must be: helpful, profound, or needs_work' };
          return;
        }

        const result = await service().voteOnInsight({
          insightId,
          userId,
          voteType,
          comment,
        });

        ctx.status = 201;
        ctx.body = { data: result };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        strapi.log.error('[Iron Chamber] Error voting on insight:', error);

        if (message.includes('not found')) {
          ctx.status = 404;
          ctx.body = { error: message };
        } else if (message.includes('permission')) {
          ctx.status = 403;
          ctx.body = { error: message };
        } else if (message.includes('already voted')) {
          ctx.status = 409;
          ctx.body = { error: message };
        } else {
          ctx.status = 500;
          ctx.body = { error: 'Internal server error' };
        }
      }
    },

    /**
     * Get living commentary for a verse
     * GET /api/iron-chamber/living-commentary/:verseId
     */
    async getLivingCommentary(ctx: any) {
      try {
        const { verseId } = ctx.params;

        const commentaries = await service().getLivingCommentaryByVerse(verseId);

        ctx.status = 200;
        ctx.body = { data: commentaries };
      } catch (error) {
        strapi.log.error('[Iron Chamber] Error getting living commentary:', error);
        ctx.status = 500;
        ctx.body = { error: 'Internal server error' };
      }
    },

    /**
     * Curate a living commentary entry from insights
     * POST /api/iron-chamber/curate-commentary
     */
    async curateCommentary(ctx: any) {
      try {
        const { verseId, title, content, type, sourceInsightIds, curatedBy, themes } = ctx.request.body;

        if (!verseId || !title || !content || !type || !curatedBy) {
          ctx.status = 400;
          ctx.body = { error: 'verseId, title, content, type, and curatedBy are required' };
          return;
        }

        const validTypes = ['exegetical', 'devotional', 'practical', 'theological'];
        if (!validTypes.includes(type)) {
          ctx.status = 400;
          ctx.body = { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` };
          return;
        }

        const commentary = await service().curateCommentary({
          verseId,
          title,
          content,
          type,
          sourceInsightIds,
          curatedBy,
          themes,
        });

        ctx.status = 201;
        ctx.body = { data: commentary };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        strapi.log.error('[Iron Chamber] Error curating commentary:', error);

        if (message.includes('not found')) {
          ctx.status = 404;
          ctx.body = { error: message };
        } else {
          ctx.status = 500;
          ctx.body = { error: 'Internal server error' };
        }
      }
    },

    /**
     * Manually trigger AI analysis on a reflection
     * POST /api/iron-chamber/analyze-reflection/:reflectionId
     */
    async analyzeReflection(ctx: any) {
      try {
        const { reflectionId } = ctx.params;

        const result = await service().analyzeReflection(reflectionId);

        ctx.status = 202;
        ctx.body = { data: result };
      } catch (error) {
        strapi.log.error('[Iron Chamber] Error enqueuing analysis:', error);
        ctx.status = 500;
        ctx.body = { error: 'Internal server error' };
      }
    },
  };
};
