import type { Core } from '@strapi/strapi';

/**
 * Phase 13: Render Job Controller
 *
 * REST API endpoints for render job operations
 */

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * POST /api/render-jobs/trigger
   * Create and queue a new render job
   *
   * Body: { sessionId: string, format?: string, metadata?: object }
   */
  async trigger(ctx: any) {
    const { sessionId, format, metadata } = ctx.request.body;

    if (!sessionId) {
      return ctx.badRequest('sessionId is required');
    }

    try {
      const renderJobService = strapi.service('api::render-job.render-job-service') as any;

      const job = await renderJobService.createJob({
        sessionId,
        format,
        metadata,
      });

      ctx.body = {
        success: true,
        data: {
          jobId: job.jobId,
          status: job.status,
          format: job.format,
          sessionId: job.recordingSession?.id || sessionId,
          progress: job.progress,
          createdAt: job.createdAt,
        },
      };
    } catch (error) {
      strapi.log.error('[render-job-controller] Trigger failed:', error);
      ctx.badRequest(error instanceof Error ? error.message : 'Failed to trigger render job');
    }
  },

  /**
   * GET /api/render-jobs/:jobId
   * Get render job status and details
   */
  async get(ctx: any) {
    const { jobId } = ctx.params;

    if (!jobId) {
      return ctx.badRequest('jobId is required');
    }

    try {
      const renderJobService = strapi.service('api::render-job.render-job-service') as any;

      const job = await renderJobService.getJob(jobId);

      // Calculate render duration if available
      let renderDurationMs: number | null = null;
      if (job.renderStartedAt && job.renderCompletedAt) {
        renderDurationMs =
          new Date(job.renderCompletedAt).getTime() - new Date(job.renderStartedAt).getTime();
      }

      ctx.body = {
        success: true,
        data: {
          jobId: job.jobId,
          status: job.status,
          progress: job.progress,
          format: job.format,
          sessionId: job.recordingSession?.id,
          edlId: job.edl?.id,
          edlVersion: job.edl?.version,
          outputVideoUrl: job.output_r2_url,
          outputThumbnailUrl: job.output_thumbnail_url,
          outputChaptersUrl: job.output_chapters_url,
          outputSubtitlesUrl: job.output_subtitles_url,
          durationMs: job.duration_ms,
          fileSizeBytes: job.fileSize_bytes,
          resolution: job.resolution,
          fps: job.fps,
          bullmqJobId: job.bullmq_job_id,
          errorMessage: job.errorMessage,
          metadata: job.metadata,
          renderStartedAt: job.renderStartedAt,
          renderCompletedAt: job.renderCompletedAt,
          renderDurationMs,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        },
      };
    } catch (error) {
      strapi.log.error('[render-job-controller] Get failed:', error);
      ctx.notFound(error instanceof Error ? error.message : 'Render job not found');
    }
  },

  /**
   * GET /api/render-jobs/session/:sessionId
   * Get all render jobs for a session
   */
  async getBySession(ctx: any) {
    const { sessionId } = ctx.params;

    if (!sessionId) {
      return ctx.badRequest('sessionId is required');
    }

    try {
      const renderJobService = strapi.service('api::render-job.render-job-service') as any;

      const jobs = await renderJobService.getJobsForSession(sessionId);

      ctx.body = {
        success: true,
        data: jobs.map((job: any) => ({
          jobId: job.jobId,
          status: job.status,
          progress: job.progress,
          format: job.format,
          outputVideoUrl: job.output_r2_url,
          errorMessage: job.errorMessage,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        })),
      };
    } catch (error) {
      strapi.log.error('[render-job-controller] Get by session failed:', error);
      ctx.badRequest(
        error instanceof Error ? error.message : 'Failed to fetch render jobs for session'
      );
    }
  },

  /**
   * POST /api/render-jobs/:jobId/retry
   * Retry a failed render job
   */
  async retry(ctx: any) {
    const { jobId } = ctx.params;

    if (!jobId) {
      return ctx.badRequest('jobId is required');
    }

    try {
      const renderJobService = strapi.service('api::render-job.render-job-service') as any;

      const job = await renderJobService.retryJob(jobId);

      ctx.body = {
        success: true,
        data: {
          jobId: job.jobId,
          status: job.status,
          progress: job.progress,
        },
      };
    } catch (error) {
      strapi.log.error('[render-job-controller] Retry failed:', error);
      ctx.badRequest(error instanceof Error ? error.message : 'Failed to retry render job');
    }
  },

  /**
   * POST /api/render-jobs/:jobId/cancel
   * Cancel an active render job
   */
  async cancel(ctx: any) {
    const { jobId } = ctx.params;

    if (!jobId) {
      return ctx.badRequest('jobId is required');
    }

    try {
      const renderJobService = strapi.service('api::render-job.render-job-service') as any;

      const job = await renderJobService.cancelJob(jobId);

      ctx.body = {
        success: true,
        data: {
          jobId: job.jobId,
          status: job.status,
        },
      };
    } catch (error) {
      strapi.log.error('[render-job-controller] Cancel failed:', error);
      ctx.badRequest(error instanceof Error ? error.message : 'Failed to cancel render job');
    }
  },
});
