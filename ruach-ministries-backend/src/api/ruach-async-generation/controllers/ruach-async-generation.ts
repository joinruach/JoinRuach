/**
 * Ruach Async Generation Controller
 * HTTP endpoints for async content generation
 */

import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Queue a new generation job
   * POST /api/ruach-async-generation/queue
   */
  async queue(ctx: any) {
    const { query, outputType, mode, templateId, filters, retrievalLimit, relevanceThreshold, strictMode, priority, webhookUrl } = ctx.request.body;

    if (!query || !outputType || !mode) {
      return ctx.badRequest('Missing required fields: query, outputType, mode');
    }

    const validOutputTypes = ['sermon', 'study', 'qa_answer', 'doctrine_page'];
    if (!validOutputTypes.includes(outputType)) {
      return ctx.badRequest(`Invalid outputType. Must be one of: ${validOutputTypes.join(', ')}`);
    }

    const validModes = ['scripture_library', 'scripture_only', 'teaching_voice'];
    if (!validModes.includes(mode)) {
      return ctx.badRequest(`Invalid mode. Must be one of: ${validModes.join(', ')}`);
    }

    try {
      const asyncService = strapi.service('api::library.ruach-async-generation') as any;

      // Ensure queue is initialized
      await asyncService.initialize();

      const result = await asyncService.queueGeneration({
        requestId: ctx.state.requestId || `req_${Date.now()}`,
        query,
        outputType,
        mode,
        templateId,
        filters,
        retrievalLimit,
        relevanceThreshold,
        strictMode,
        userId: ctx.state.user?.id,
        priority,
        webhookUrl,
      });

      return ctx.send({
        success: true,
        jobId: result.jobId,
        estimatedTimeMs: result.estimatedTimeMs,
        statusUrl: `/api/ruach-async-generation/status/${result.jobId}`,
      });
    } catch (error: any) {
      strapi.log.error('Error queueing generation job:', error);
      return ctx.internalServerError('Failed to queue generation job');
    }
  },

  /**
   * Get job status
   * GET /api/ruach-async-generation/status/:jobId
   */
  async status(ctx: any) {
    const { jobId } = ctx.params;

    if (!jobId) {
      return ctx.badRequest('Missing jobId parameter');
    }

    try {
      const asyncService = strapi.service('api::library.ruach-async-generation') as any;
      await asyncService.initialize();

      const status = await asyncService.getJobStatus(jobId);

      if (!status) {
        return ctx.notFound('Job not found');
      }

      return ctx.send(status);
    } catch (error: any) {
      strapi.log.error('Error getting job status:', error);
      return ctx.internalServerError('Failed to get job status');
    }
  },

  /**
   * Cancel a pending job
   * DELETE /api/ruach-async-generation/jobs/:jobId
   */
  async cancel(ctx: any) {
    const { jobId } = ctx.params;

    if (!jobId) {
      return ctx.badRequest('Missing jobId parameter');
    }

    try {
      const asyncService = strapi.service('api::library.ruach-async-generation') as any;
      await asyncService.initialize();

      const cancelled = await asyncService.cancelJob(jobId);

      if (!cancelled) {
        return ctx.badRequest('Job cannot be cancelled (may be already processing or completed)');
      }

      return ctx.send({ success: true, message: 'Job cancelled' });
    } catch (error: any) {
      strapi.log.error('Error cancelling job:', error);
      return ctx.internalServerError('Failed to cancel job');
    }
  },

  /**
   * List jobs
   * GET /api/ruach-async-generation/jobs
   */
  async list(ctx: any) {
    const { status, limit, offset } = ctx.query;

    try {
      const asyncService = strapi.service('api::library.ruach-async-generation') as any;
      await asyncService.initialize();

      const jobs = await asyncService.listJobs({
        status,
        limit: parseInt(limit) || 20,
        offset: parseInt(offset) || 0,
      });

      return ctx.send({
        jobs,
        count: jobs.length,
      });
    } catch (error: any) {
      strapi.log.error('Error listing jobs:', error);
      return ctx.internalServerError('Failed to list jobs');
    }
  },

  /**
   * Get queue statistics
   * GET /api/ruach-async-generation/stats
   */
  async stats(ctx: any) {
    try {
      const asyncService = strapi.service('api::library.ruach-async-generation') as any;
      await asyncService.initialize();

      const stats = await asyncService.getQueueStats();

      return ctx.send(stats);
    } catch (error: any) {
      strapi.log.error('Error getting queue stats:', error);
      return ctx.internalServerError('Failed to get queue stats');
    }
  },

  /**
   * Poll for job result (long polling)
   * GET /api/ruach-async-generation/poll/:jobId
   */
  async poll(ctx: any) {
    const { jobId } = ctx.params;
    const { timeout } = ctx.query;
    const maxTimeout = Math.min(parseInt(timeout) || 30000, 60000); // Max 60 seconds

    if (!jobId) {
      return ctx.badRequest('Missing jobId parameter');
    }

    try {
      const asyncService = strapi.service('api::library.ruach-async-generation') as any;
      await asyncService.initialize();

      const startTime = Date.now();
      const pollInterval = 1000; // 1 second

      while (Date.now() - startTime < maxTimeout) {
        const status = await asyncService.getJobStatus(jobId);

        if (!status) {
          return ctx.notFound('Job not found');
        }

        if (status.status === 'completed' || status.status === 'failed') {
          return ctx.send(status);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      // Timeout - return current status
      const finalStatus = await asyncService.getJobStatus(jobId);
      return ctx.send({
        ...finalStatus,
        polling: 'timeout',
        message: 'Polling timeout - job still processing',
      });
    } catch (error: any) {
      strapi.log.error('Error polling job:', error);
      return ctx.internalServerError('Failed to poll job');
    }
  },
});
