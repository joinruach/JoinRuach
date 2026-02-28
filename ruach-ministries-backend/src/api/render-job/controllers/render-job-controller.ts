import type { Core } from '@strapi/strapi';
import {
  TriggerRenderRequestSchema,
  RenderAllParamsSchema,
} from '../validators/render-job-validators';
import { validateRequest } from '../../../utils/validate-request';
import { ALL_FORMAT_SLUGS } from '../../../services/format-presets';
import RemotionRunner from '../../../services/remotion-runner';
import { RenderServiceError } from '../services/render-job-service';

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
    const data = validateRequest(ctx, TriggerRenderRequestSchema, ctx.request.body);
    if (!data) return;

    const { sessionId, format, metadata, operatorOverride } = data;

    try {
      const renderJobService = strapi.service('api::render-job.render-job-service') as any;

      const job = await renderJobService.createJob({
        sessionId,
        format,
        metadata,
        operatorOverride,
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
      if (error instanceof RenderServiceError) {
        ctx.status = error.httpStatus;
        ctx.body = { error: error.message, code: error.code };
        return;
      }
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

      // Extract cost data from metadata for top-level visibility
      const costData = job.metadata?.costData ?? null;

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
          costData,
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

  /**
   * POST /api/render-jobs/render-all/:sessionId
   * Create render jobs for all format presets
   */
  async renderAll(ctx: any) {
    const params = validateRequest(ctx, RenderAllParamsSchema, ctx.params);
    if (!params) return;

    const { sessionId } = params;
    const operatorOverride = ctx.request.body?.operatorOverride === true;

    try {
      const renderJobService = strapi.service('api::render-job.render-job-service') as any;

      const jobs = await Promise.all(
        ALL_FORMAT_SLUGS.map((format) =>
          renderJobService.createJob({ sessionId, format, operatorOverride })
        )
      );

      ctx.body = {
        success: true,
        data: jobs.map((job: any) => ({
          jobId: job.jobId,
          format: job.format,
          status: job.status,
        })),
      };
    } catch (error) {
      strapi.log.error('[render-job-controller] Render-all failed:', error);
      if (error instanceof RenderServiceError) {
        ctx.status = error.httpStatus;
        ctx.body = { error: error.message, code: error.code };
        return;
      }
      ctx.badRequest(
        error instanceof Error ? error.message : 'Failed to create render-all jobs'
      );
    }
  },

  /**
   * GET /api/render-jobs/:jobId/progress
   * SSE endpoint that streams render progress from Lambda
   */
  async progress(ctx: any) {
    const { jobId } = ctx.params;

    if (!jobId) {
      return ctx.badRequest('jobId is required');
    }

    const renderJobService = strapi.service('api::render-job.render-job-service') as any;

    let job: any;
    try {
      job = await renderJobService.getJob(jobId);
    } catch {
      ctx.status = 404;
      ctx.body = { error: 'Render job not found' };
      return;
    }

    // If already terminal, return final state as single SSE event
    const terminalStatuses = ['completed', 'failed', 'cancelled'];
    if (terminalStatuses.includes(job.status)) {
      ctx.status = 200;
      ctx.type = 'text/event-stream';
      ctx.set('Cache-Control', 'no-cache');
      ctx.set('Connection', 'keep-alive');
      ctx.respond = false;

      const res = ctx.res;
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      const payload = JSON.stringify({
        status: job.status,
        progress: job.progress,
        outputUrl: job.output_r2_url ?? null,
        error: job.errorMessage ?? null,
      });
      res.write(`data: ${payload}\n\n`);
      res.end();
      return;
    }

    // Stream progress for active renders
    ctx.respond = false;
    const res = ctx.res;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    let closed = false;
    ctx.req.on('close', () => {
      closed = true;
    });

    const pollIntervalMs = 2000;
    const maxPolls = 900;

    for (let i = 0; i < maxPolls && !closed; i++) {
      try {
        const freshJob = await renderJobService.getJob(jobId);

        const payload = JSON.stringify({
          status: freshJob.status,
          progress: freshJob.progress,
          outputUrl: freshJob.output_r2_url ?? null,
          error: freshJob.errorMessage ?? null,
        });
        res.write(`data: ${payload}\n\n`);

        if (terminalStatuses.includes(freshJob.status)) {
          break;
        }
      } catch {
        res.write(`data: ${JSON.stringify({ error: 'Failed to fetch job status' })}\n\n`);
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    if (!closed) {
      res.end();
    }
  },
});
