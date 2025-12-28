/**
 * Iron Chamber Controller
 * Handles API requests for margin reflections, insights, and living commentary
 */

import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const entityService = strapi.entityService as any;

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

      // Find verse
      const verses = await entityService.findMany('api::scripture-verse.scripture-verse', {
        filters: { verseId: { $eq: verseId } },
      });

      if (!Array.isArray(verses) || verses.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Verse not found' };
        return;
      }

      // Check if user has permission to submit insights
      const canSubmit = await this._checkCanSubmitInsights(userId || anonymousUserId);
      if (!canSubmit) {
        ctx.status = 403;
        ctx.body = { error: 'User does not have permission to submit insights. Complete at least one checkpoint first.' };
        return;
      }

      // Create margin reflection
        const reflection = await entityService.create('api::margin-reflection.margin-reflection', {
        data: {
          verse: verses[0].id,
          content,
          author: userId || null,
          publishedAt: null, // Draft until validated
        },
      });

      // Trigger AI analysis
      const reflectionId = `margin-${reflection.id}-${Date.now()}`;
      await strapi.service('api::formation-engine.bull-queue').enqueueReflectionAnalysis({
        reflectionId,
      });

      ctx.status = 201;
      ctx.body = { data: reflection };
    } catch (error) {
      strapi.log.error('Error submitting margin reflection:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  },

  /**
   * Get margin reflections for a verse
   * GET /api/iron-chamber/margin-reflections/:verseId
   */
  async getMarginReflections(ctx: any) {
    try {
      const { verseId } = ctx.params;

      const reflections = await entityService.findMany('api::margin-reflection.margin-reflection', {
        filters: {
          verse: {
            verseId: { $eq: verseId },
          },
          publishedAt: { $notNull: true }, // Only published
        },
        populate: ['author', 'verse'],
        sort: { helpfulCount: 'desc' },
      });

      ctx.status = 200;
      ctx.body = { data: reflections };
    } catch (error) {
      strapi.log.error('Error getting margin reflections:', error);
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
      const { theme, limit = 20, offset = 0 } = ctx.query;

      const filters: any = {
        status: { $eq: 'published' },
      };

      if (theme) {
        filters.themes = {
          name: { $eq: theme },
        };
      }

      const insights = await entityService.findMany('api::iron-insight.iron-insight', {
        filters,
        populate: ['verse', 'themes', 'user'],
        sort: { publishedAt: 'desc', voteScore: 'desc' },
        limit: parseInt(limit, 10),
        start: parseInt(offset, 10),
      });

      ctx.status = 200;
      ctx.body = { data: insights };
    } catch (error) {
      strapi.log.error('Error getting insights:', error);
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

      const insights = await entityService.findMany('api::iron-insight.iron-insight', {
        filters: { insightId: { $eq: insightId } },
        populate: ['verse', 'themes', 'user', 'votes'],
      });

      if (!Array.isArray(insights) || insights.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Insight not found' };
        return;
      }

      ctx.status = 200;
      ctx.body = { data: insights[0] };
    } catch (error) {
      strapi.log.error('Error getting insight:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
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
        ctx.body = { error: 'Invalid voteType' };
        return;
      }

      // Check if user can validate insights
      const canValidate = await this._checkCanValidateInsights(userId);
      if (!canValidate) {
        ctx.status = 403;
        ctx.body = { error: 'User does not have permission to validate insights' };
        return;
      }

      // Find insight
      const insights = await entityService.findMany('api::iron-insight.iron-insight', {
        filters: { insightId: { $eq: insightId } },
      });

      if (!Array.isArray(insights) || insights.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Insight not found' };
        return;
      }

      // Create vote
      const vote = await entityService.create('api::insight-vote.insight-vote', {
        data: {
          insight: insights[0].id,
          user: userId,
          voteType,
          comment: comment || null,
          votedAt: new Date(),
        },
      });

      // Update insight vote score
      const voteWeight = voteType === 'helpful' ? 1 : voteType === 'profound' ? 2 : -1;
      const newScore = (insights[0].voteScore || 0) + voteWeight;

      await entityService.update('api::iron-insight.iron-insight', insights[0].id, {
        data: { voteScore: newScore },
      });

      ctx.status = 201;
      ctx.body = { data: vote };
    } catch (error) {
      strapi.log.error('Error voting on insight:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  },

  /**
   * Get living commentary for a verse
   * GET /api/iron-chamber/living-commentary/:verseId
   */
  async getLivingCommentary(ctx: any) {
    try {
      const { verseId } = ctx.params;

      const commentaries = await entityService.findMany('api::living-commentary.living-commentary', {
        filters: {
          verse: {
            verseId: { $eq: verseId },
          },
          publishedAt: { $notNull: true },
        },
        populate: ['verse', 'themes', 'contributors', 'curatedBy'],
        sort: { qualityScore: 'desc' },
      });

      ctx.status = 200;
      ctx.body = { data: commentaries };
    } catch (error) {
      strapi.log.error('Error getting living commentary:', error);
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

      // Find verse
      const verses = await entityService.findMany('api::scripture-verse.scripture-verse', {
        filters: { verseId: { $eq: verseId } },
      });

      if (!Array.isArray(verses) || verses.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Verse not found' };
        return;
      }

      // Create living commentary
      const commentary = await entityService.create('api::living-commentary.living-commentary', {
        data: {
          verse: verses[0].id,
          title,
          content,
          type,
          sourceInsights: sourceInsightIds || [],
          curatedBy,
          themes: themes || [],
          publishedAt: new Date(),
        },
      });

      ctx.status = 201;
      ctx.body = { data: commentary };
    } catch (error) {
      strapi.log.error('Error curating commentary:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  },

  /**
   * Manually trigger AI analysis on a reflection
   * POST /api/iron-chamber/analyze-reflection/:reflectionId
   */
  async analyzeReflection(ctx: any) {
    try {
      const { reflectionId } = ctx.params;

      await strapi.service('api::formation-engine.bull-queue').enqueueReflectionAnalysis({
        reflectionId,
      });

      ctx.status = 202;
      ctx.body = { message: 'Analysis enqueued' };
    } catch (error) {
      strapi.log.error('Error enqueuing analysis:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  },

  // Helper methods
  async _checkCanSubmitInsights(userId: string | number): Promise<boolean> {
    try {
      const filters: any = typeof userId === 'number'
        ? { user: { id: userId } }
        : { anonymousUserId: { $eq: userId } };

      const journey = await entityService.findMany('api::formation-journey.formation-journey', {
        filters,
      });

      if (!Array.isArray(journey) || journey.length === 0) {
        return false;
      }

      const checkpointsCompleted = journey[0].checkpointsCompleted || [];
      return checkpointsCompleted.length > 0;
    } catch (error) {
      strapi.log.error('Error checking submit permission:', error);
      return false;
    }
  },

  async _checkCanValidateInsights(userId: number): Promise<boolean> {
    try {
      const journey = await entityService.findMany('api::formation-journey.formation-journey', {
        filters: { user: { id: userId } },
      });

      if (!Array.isArray(journey) || journey.length === 0) {
        return false;
      }

      const phaseOrder: Record<string, number> = {
        awakening: 1,
        separation: 2,
        discernment: 3,
        commission: 4,
        stewardship: 5,
      };

      const currentPhaseOrder = phaseOrder[journey[0].currentPhase] || 1;
      const reflectionsCount = journey[0].reflectionsSubmitted || 0;

      return currentPhaseOrder >= 3 && reflectionsCount >= 5;
    } catch (error) {
      strapi.log.error('Error checking validate permission:', error);
      return false;
    }
  },
  };
};
