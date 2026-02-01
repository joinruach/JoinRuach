/**
 * Ruach Discernment Controller
 * Handles HTTP requests for biblical content discernment
 */

import type { Core } from '@strapi/strapi';

export default {
  /**
   * POST /api/ruach-discernment/analyze
   * Submit content for biblical analysis
   */
  async analyze(ctx: any) {
    try {
      const user = ctx.state.user;

      // Verify admin access
      if (!user) {
        return ctx.unauthorized('Admin access required');
      }

      const { sourceTitle, sourceUrl, sourceContent, useClaudeAPI = true } = ctx.request.body;

      if (!sourceTitle || !sourceContent) {
        return ctx.badRequest('sourceTitle and sourceContent are required');
      }

      const discernmentService = strapi.service(
        'api::library.ruach-discernment'
      ) as any;

      const result = await discernmentService.analyzeContent(
        sourceTitle,
        sourceUrl,
        sourceContent,
        useClaudeAPI
      );

      ctx.body = {
        success: true,
        data: result,
      };
    } catch (error: any) {
      strapi.log.error('Error in analyze controller:', error);
      ctx.internalServerError('Failed to analyze content');
    }
  },

  /**
   * GET /api/ruach-discernment/analyses
   * List all analyses with optional filters
   */
  async listAnalyses(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Admin access required');
      }

      const {
        status,
        category,
        minConcern,
        maxConcern,
        startDate,
        endDate,
        sort = 'analysisDate:desc',
        page = 1,
        pageSize = 25,
      } = ctx.query;

      const discernmentService = strapi.service(
        'api::library.ruach-discernment'
      ) as any;

      const result = await discernmentService.listAnalyses(
        {
          status: status as string | undefined,
          categoryFilter: category as string | undefined,
          minConcern: minConcern ? parseFloat(minConcern as string) : undefined,
          maxConcern: maxConcern ? parseFloat(maxConcern as string) : undefined,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
        },
        sort as string,
        {
          page: parseInt(page as string) || 1,
          pageSize: parseInt(pageSize as string) || 25,
        }
      );

      ctx.body = {
        success: true,
        data: result.data,
        total: result.total,
        page: parseInt(page as string) || 1,
        pageSize: parseInt(pageSize as string) || 25,
      };
    } catch (error: any) {
      strapi.log.error('Error listing analyses:', error);
      ctx.internalServerError('Failed to list analyses');
    }
  },

  /**
   * GET /api/ruach-discernment/analyses/:analysisId
   * Get specific analysis by ID
   */
  async getAnalysis(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Admin access required');
      }

      const { analysisId } = ctx.params;

      const discernmentService = strapi.service(
        'api::library.ruach-discernment'
      ) as any;

      const analysis = await discernmentService.getAnalysisById(analysisId);

      if (!analysis) {
        return ctx.notFound(`Analysis ${analysisId} not found`);
      }

      ctx.body = {
        success: true,
        data: analysis,
      };
    } catch (error: any) {
      strapi.log.error('Error getting analysis:', error);
      ctx.internalServerError('Failed to retrieve analysis');
    }
  },

  /**
   * POST /api/ruach-discernment/trend-report
   * Generate trend report for analysis period
   */
  async generateTrendReport(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Admin access required');
      }

      const { startDate, endDate } = ctx.request.body;

      if (!startDate || !endDate) {
        return ctx.badRequest('startDate and endDate are required');
      }

      const discernmentService = strapi.service(
        'api::library.ruach-discernment'
      ) as any;

      const report = await discernmentService.generateTrendReport(
        new Date(startDate),
        new Date(endDate)
      );

      ctx.body = {
        success: true,
        data: report,
      };
    } catch (error: any) {
      strapi.log.error('Error generating trend report:', error);
      ctx.internalServerError('Failed to generate trend report');
    }
  },

  /**
   * PUT /api/ruach-discernment/analyses/:analysisId
   * Update analysis status and add review notes
   */
  async updateAnalysis(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Admin access required');
      }

      const { analysisId } = ctx.params;
      const { status, reviewNotes } = ctx.request.body;

      if (!status) {
        return ctx.badRequest('status is required');
      }

      const validStatuses = ['pending', 'analyzed', 'reviewed', 'published'];
      if (!validStatuses.includes(status)) {
        return ctx.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const entityService = strapi.entityService as any;

      // Find the analysis by analysisId
      const analyses = await entityService.findMany(
        'api::discernment-analysis.discernment-analysis',
        {
          filters: { analysisId },
        }
      );

      if (!analyses || analyses.length === 0) {
        return ctx.notFound(`Analysis ${analysisId} not found`);
      }

      const analysis = analyses[0];

      // Update the analysis
      const updated = await entityService.update(
        'api::discernment-analysis.discernment-analysis',
        analysis.id,
        {
          data: {
            status,
            reviewNotes: reviewNotes || analysis.reviewNotes,
            reviewedBy: user.id,
          },
        }
      );

      ctx.body = {
        success: true,
        data: updated,
      };
    } catch (error: any) {
      strapi.log.error('Error updating analysis:', error);
      ctx.internalServerError('Failed to update analysis');
    }
  },

  /**
   * POST /api/ruach-discernment/analyses/:analysisId/publish
   * Publish analysis for stakeholder viewing
   */
  async publishAnalysis(ctx: any) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('Admin access required');
      }

      const { analysisId } = ctx.params;

      const entityService = strapi.entityService as any;

      // Find the analysis
      const analyses = await entityService.findMany(
        'api::discernment-analysis.discernment-analysis',
        {
          filters: { analysisId },
        }
      );

      if (!analyses || analyses.length === 0) {
        return ctx.notFound(`Analysis ${analysisId} not found`);
      }

      const analysis = analyses[0];

      // Publish the analysis
      const published = await entityService.update(
        'api::discernment-analysis.discernment-analysis',
        analysis.id,
        {
          data: {
            publishedAt: new Date(),
            status: 'published',
          },
        }
      );

      ctx.body = {
        success: true,
        message: 'Analysis published successfully',
        data: published,
      };
    } catch (error: any) {
      strapi.log.error('Error publishing analysis:', error);
      ctx.internalServerError('Failed to publish analysis');
    }
  },
} as const;
