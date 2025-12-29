/**
 * Iron Chamber Service
 * Business logic for margin reflections, insights, and living commentary
 */

import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const entityService = strapi.entityService as any;

  return {
    /**
     * Check if user can submit insights to Iron Chamber
     * Requires at least one checkpoint completed
     */
    async canSubmitInsights(userId: string | number): Promise<boolean> {
      try {
        const filters: any = typeof userId === 'number'
          ? { user: { id: userId } }
          : { anonymousUserId: { $eq: userId } };

        const journeys = await entityService.findMany('api::formation-journey.formation-journey', {
          filters,
          limit: 1,
        });

        if (!Array.isArray(journeys) || journeys.length === 0) {
          return false;
        }

        const journey = journeys[0];
        const checkpointsCompleted = journey.checkpointsCompleted || [];
        return checkpointsCompleted.length > 0;
      } catch (error) {
        strapi.log.error('[Iron Chamber] Error checking submit permission:', error);
        return false;
      }
    },

    /**
     * Check if user can validate insights (vote)
     * Requires Discernment phase (3+) and at least 5 reflections
     */
    async canValidateInsights(userId: number): Promise<boolean> {
      try {
        const journeys = await entityService.findMany('api::formation-journey.formation-journey', {
          filters: { user: { id: userId } },
          limit: 1,
        });

        if (!Array.isArray(journeys) || journeys.length === 0) {
          return false;
        }

        const journey = journeys[0];
        const phaseOrder: Record<string, number> = {
          awakening: 1,
          separation: 2,
          discernment: 3,
          commission: 4,
          stewardship: 5,
        };

        const currentPhaseOrder = phaseOrder[journey.currentPhase] || 1;
        const reflectionsCount = journey.reflectionsSubmitted || 0;

        return currentPhaseOrder >= 3 && reflectionsCount >= 5;
      } catch (error) {
        strapi.log.error('[Iron Chamber] Error checking validate permission:', error);
        return false;
      }
    },

    /**
     * Create a margin reflection on a verse
     */
    async createMarginReflection(data: {
      verseId: string;
      content: string;
      userId?: number;
      anonymousUserId?: string;
    }) {
      const { verseId, content, userId, anonymousUserId } = data;

      // Find verse
      const verses = await entityService.findMany('api::scripture-verse.scripture-verse', {
        filters: { verseId: { $eq: verseId } },
        limit: 1,
      });

      if (!Array.isArray(verses) || verses.length === 0) {
        throw new Error('Verse not found');
      }

      // Check permission
      const canSubmit = await this.canSubmitInsights(userId || anonymousUserId!);
      if (!canSubmit) {
        throw new Error('User does not have permission to submit insights. Complete at least one checkpoint first.');
      }

      // Create reflection
      const reflection = await entityService.create('api::margin-reflection.margin-reflection', {
        data: {
          verse: verses[0].id,
          content,
          author: userId || null,
          publishedAt: null, // Draft until AI analyzes
        },
      });

      // Trigger AI analysis
      const reflectionId = `margin-${reflection.id}-${Date.now()}`;
      await strapi.service('api::formation-engine.bull-queue').enqueueReflectionAnalysis({
        reflectionId,
        marginReflectionId: reflection.id,
      });

      return reflection;
    },

    /**
     * Get published margin reflections for a verse
     */
    async getMarginReflectionsByVerse(verseId: string, options: {
      limit?: number;
      offset?: number;
      sortBy?: 'recent' | 'helpful';
    } = {}) {
      const { limit = 25, offset = 0, sortBy = 'helpful' } = options;

      const sort = sortBy === 'helpful'
        ? { helpfulCount: 'desc' as const, createdAt: 'desc' as const }
        : { createdAt: 'desc' as const };

      const reflections = await entityService.findMany('api::margin-reflection.margin-reflection', {
        filters: {
          verse: {
            verseId: { $eq: verseId },
          },
          publishedAt: { $notNull: true },
        },
        populate: ['author', 'verse'],
        sort,
        limit,
        start: offset,
      });

      return reflections;
    },

    /**
     * Get published insights with filtering and pagination
     */
    async getInsights(filters: {
      verseId?: string;
      theme?: string;
      status?: 'published' | 'in_review';
      limit?: number;
      offset?: number;
      sortBy?: 'recent' | 'upvotes' | 'depth';
    } = {}) {
      const {
        verseId,
        theme,
        status = 'published',
        limit = 25,
        offset = 0,
        sortBy = 'recent',
      } = filters;

      const queryFilters: any = {
        status: { $eq: status },
      };

      if (verseId) {
        queryFilters.verse = {
          verseId: { $eq: verseId },
        };
      }

      if (theme) {
        queryFilters.themes = {
          name: { $eq: theme },
        };
      }

      const sortOptions: any = {
        recent: { publishedAt: 'desc' },
        upvotes: { voteScore: 'desc', publishedAt: 'desc' },
        depth: { depthScore: 'desc', publishedAt: 'desc' },
      };

      const insights = await entityService.findMany('api::iron-insight.iron-insight', {
        filters: queryFilters,
        populate: ['verse', 'themes', 'user'],
        sort: sortOptions[sortBy],
        limit,
        start: offset,
      });

      return insights;
    },

    /**
     * Get a specific insight by ID
     */
    async getInsightById(insightId: string) {
      const insights = await entityService.findMany('api::iron-insight.iron-insight', {
        filters: { insightId: { $eq: insightId } },
        populate: ['verse', 'themes', 'user', 'votes'],
        limit: 1,
      });

      if (!Array.isArray(insights) || insights.length === 0) {
        throw new Error('Insight not found');
      }

      return insights[0];
    },

    /**
     * Vote on an insight
     */
    async voteOnInsight(data: {
      insightId: string;
      userId: number;
      voteType: 'helpful' | 'profound' | 'needs_work';
      comment?: string;
    }) {
      const { insightId, userId, voteType, comment } = data;

      // Check permission
      const canValidate = await this.canValidateInsights(userId);
      if (!canValidate) {
        throw new Error('User does not have permission to validate insights');
      }

      // Find insight
      const insight = await this.getInsightById(insightId);

      // Check if user already voted
      const existingVotes = await entityService.findMany('api::insight-vote.insight-vote', {
        filters: {
          insight: { id: insight.id },
          user: { id: userId },
        },
        limit: 1,
      });

      if (Array.isArray(existingVotes) && existingVotes.length > 0) {
        throw new Error('User has already voted on this insight');
      }

      // Create vote
      const vote = await entityService.create('api::insight-vote.insight-vote', {
        data: {
          insight: insight.id,
          user: userId,
          voteType,
          comment: comment || null,
          votedAt: new Date(),
        },
      });

      // Update insight vote score
      const voteWeight = voteType === 'helpful' ? 1 : voteType === 'profound' ? 2 : -1;
      const newScore = (insight.voteScore || 0) + voteWeight;

      await entityService.update('api::iron-insight.iron-insight', insight.id, {
        data: { voteScore: newScore },
      });

      return { vote, updatedScore: newScore };
    },

    /**
     * Get living commentary for a verse
     */
    async getLivingCommentaryByVerse(verseId: string) {
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

      return commentaries;
    },

    /**
     * Curate living commentary from insights
     */
    async curateCommentary(data: {
      verseId: string;
      title: string;
      content: string;
      type: 'exegetical' | 'devotional' | 'practical' | 'theological';
      sourceInsightIds?: number[];
      curatedBy: number;
      themes?: number[];
    }) {
      const { verseId, title, content, type, sourceInsightIds, curatedBy, themes } = data;

      // Find verse
      const verses = await entityService.findMany('api::scripture-verse.scripture-verse', {
        filters: { verseId: { $eq: verseId } },
        limit: 1,
      });

      if (!Array.isArray(verses) || verses.length === 0) {
        throw new Error('Verse not found');
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

      return commentary;
    },

    /**
     * Trigger AI analysis on a reflection
     */
    async analyzeReflection(reflectionId: string) {
      await strapi.service('api::formation-engine.bull-queue').enqueueReflectionAnalysis({
        reflectionId,
      });

      return { message: 'Analysis enqueued', reflectionId };
    },
  };
};
