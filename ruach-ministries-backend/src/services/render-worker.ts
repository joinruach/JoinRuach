/**
 * Stage 1: Render Worker
 *
 * BullMQ worker that processes render jobs via Lambda.
 * Concurrency raised to 4 (Lambda does the heavy lifting, not local CPU).
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import type { Core } from '@strapi/strapi';
import type { RenderJobPayload } from './render-queue';
import RenderPreflight from './render-preflight';
import RemotionRunner from './remotion-runner';
import R2Upload from './r2-upload';
import { getPreset, isValidFormatSlug, type FormatSlug } from './format-presets';
import { isJobOverCeiling } from './render-cost-guard';

export default class RenderWorker {
  private static worker: Worker<RenderJobPayload> | null = null;
  private static connection: Redis | null = null;

  static async start(strapi: Core.Strapi) {
    if (this.worker) {
      console.log('[render-worker] Worker already running');
      return;
    }

    this.connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker<RenderJobPayload>(
      'render-jobs',
      async (job: Job<RenderJobPayload>) => {
        return await this.processJob(strapi, job);
      },
      {
        connection: this.connection,
        concurrency: 4,
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`[render-worker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`[render-worker] Job ${job?.id} failed:`, error);
    });

    console.log('[render-worker] Worker started (concurrency: 4)');
  }

  private static async processJob(
    strapi: Core.Strapi,
    job: Job<RenderJobPayload>
  ): Promise<void> {
    const { renderJobId, sessionId, format } = job.data;
    const formatSlug: FormatSlug = isValidFormatSlug(format) ? format : 'full_16_9';

    console.log(`[render-worker] Processing job ${renderJobId} (format: ${formatSlug})`);

    const renderJobService = strapi.service('api::render-job.render-job-service') as any;

    try {
      // Move to processing
      await renderJobService.transitionStatus(renderJobId, 'processing', {
        progress: 0.05,
        bullmqJobId: job.id,
      });

      // Preflight validation
      const preflight = await RenderPreflight.validate(strapi, renderJobId);
      if (!preflight.valid) {
        throw new Error(`Preflight failed: ${preflight.errors.join(', ')}`);
      }

      if (preflight.warnings.length > 0) {
        console.warn(`[render-worker] Warnings: ${preflight.warnings.join(', ')}`);
      }

      await renderJobService.transitionStatus(renderJobId, 'processing', {
        progress: 0.1,
      });

      // Build input props from session assets
      const renderJob = await renderJobService.getJob(renderJobId);
      const session = renderJob.recordingSession;

      const assets = await strapi.entityService.findMany('api::asset.asset' as any, {
        filters: { recordingSession: session.id },
      }) as any[];

      const cameraSources: Record<string, string> = {};
      for (const asset of assets) {
        if (asset.angle && asset.r2_video_prores_url) {
          cameraSources[asset.angle] = asset.r2_video_prores_url;
        }
      }

      const preset = getPreset(formatSlug);
      const inputProps: Record<string, unknown> = {
        sessionId,
        cameraSources,
        showCaptions: true,
        showChapters: true,
        showSpeakerLabels: true,
      };

      // Trigger Lambda render
      console.log(`[render-worker] Triggering Lambda render for ${renderJobId}`);
      const handle = await RemotionRunner.render({
        sessionId,
        formatSlug,
        inputProps,
      });

      // Poll for completion, updating progress along the way
      const result = await RemotionRunner.waitForRender(
        handle,
        async (progress) => {
          // Per-job cost ceiling check
          if (progress.costs && isJobOverCeiling(progress.costs.accruedSoFar)) {
            throw new Error(
              `Job ${renderJobId} exceeded per-job cost ceiling ` +
              `($${progress.costs.accruedSoFar.toFixed(2)} > $${process.env.RENDER_JOB_MAX_USD})`
            );
          }

          // Map Lambda progress (0-1) into our 0.1-0.85 range
          const mappedProgress = 0.1 + progress.overallProgress * 0.75;
          await renderJobService.transitionStatus(renderJobId, 'processing', {
            progress: mappedProgress,
          });
        }
      );

      console.log(`[render-worker] Lambda render done for ${renderJobId}`);

      await renderJobService.transitionStatus(renderJobId, 'processing', {
        progress: 0.9,
      });

      // Upload Lambda output to R2
      const extension = preset.isStill ? 'jpg' : 'mp4';
      const r2Key = `renders/${sessionId}/${renderJobId}.${extension}`;
      const contentType = preset.isStill ? 'image/jpeg' : 'video/mp4';

      const uploadResult = await R2Upload.uploadFromUrl(
        result.outputUrl,
        r2Key,
        contentType
      );

      if (!uploadResult.success) {
        throw new Error(`R2 upload failed: ${uploadResult.error}`);
      }

      await renderJobService.transitionStatus(renderJobId, 'processing', {
        progress: 0.95,
      });

      // Complete job with cost data from Lambda
      await renderJobService.completeJob(renderJobId, {
        outputVideoUrl: uploadResult.url!,
        fileSizeBytes: result.outputSize,
        resolution: `${preset.width}x${preset.height}`,
        fps: preset.fps,
        costData: result.costs,
      });

      console.log(`[render-worker] Job ${renderJobId} completed successfully`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const maxAttempts = job.opts?.attempts ?? 1;
      const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

      if (isLastAttempt) {
        console.error(
          `[render-worker] Job ${renderJobId} permanently failed after ${maxAttempts} attempt(s):`,
          error
        );
        await renderJobService.failJob(renderJobId, errorMessage);
      } else {
        console.warn(
          `[render-worker] Job ${renderJobId} failed (attempt ${job.attemptsMade + 1}/${maxAttempts}), will retry:`,
          errorMessage
        );
      }

      throw error;
    }
  }

  static async stop() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.connection) {
      await this.connection.quit();
      this.connection = null;
    }
    console.log('[render-worker] Worker stopped');
  }
}
