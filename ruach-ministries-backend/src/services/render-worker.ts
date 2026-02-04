/**
 * Phase 13 Plan 2: Render Worker
 *
 * BullMQ worker that processes render jobs
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import type { Core } from '@strapi/strapi';
import type { RenderJobPayload } from './render-queue';
import RenderPreflight from './render-preflight';
import RemotionRunner from './remotion-runner';
import R2Upload from './r2-upload';
import ThumbnailGenerator from './thumbnail-generator';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

export default class RenderWorker {
  private static worker: Worker<RenderJobPayload> | null = null;
  private static connection: Redis | null = null;

  /**
   * Start worker
   */
  static async start(strapi: Core.Strapi) {
    if (this.worker) {
      console.log('[render-worker] Worker already running');
      return;
    }

    // Redis connection
    this.connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

    // Create worker
    this.worker = new Worker<RenderJobPayload>(
      'render-jobs',
      async (job: Job<RenderJobPayload>) => {
        return await this.processJob(strapi, job);
      },
      {
        connection: this.connection,
        concurrency: 1, // Process one job at a time (CPU intensive)
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`[render-worker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`[render-worker] Job ${job?.id} failed:`, error);
    });

    console.log('[render-worker] Worker started');
  }

  /**
   * Process a single render job
   */
  private static async processJob(
    strapi: Core.Strapi,
    job: Job<RenderJobPayload>
  ): Promise<void> {
    const { renderJobId, sessionId, format } = job.data;

    console.log(`[render-worker] Processing job ${renderJobId}`);

    const renderJobService = strapi.service('api::render-job.render-job-service') as any;

    try {
      // Move to processing
      await renderJobService.transitionStatus(renderJobId, 'processing', {
        progress: 0.1,
        bullmqJobId: job.id,
      });

      // Preflight validation
      console.log(`[render-worker] Running preflight checks for ${renderJobId}`);
      const preflight = await RenderPreflight.validate(strapi, renderJobId);

      if (!preflight.valid) {
        throw new Error(`Preflight failed: ${preflight.errors.join(', ')}`);
      }

      if (preflight.warnings.length > 0) {
        console.warn(`[render-worker] Warnings: ${preflight.warnings.join(', ')}`);
      }

      // Get job details
      const renderJob = await renderJobService.getJob(renderJobId);
      const session = renderJob.recordingSession;

      // Build camera sources
      const assets = await strapi.entityService.findMany('api::asset.asset' as any, {
        filters: { recordingSession: session.id },
      }) as any[];

      const cameraSources: Record<string, string> = {};
      for (const asset of assets) {
        if (asset.angle && asset.r2_video_prores_url) {
          cameraSources[asset.angle] = asset.r2_video_prores_url;
        }
      }

      // Update progress
      await renderJobService.transitionStatus(renderJobId, 'processing', {
        progress: 0.2,
      });

      // Execute Remotion render
      console.log(`[render-worker] Starting Remotion render for ${renderJobId}`);

      const outputPath = path.join(
        os.tmpdir(),
        'ruach-renders',
        `${renderJobId}.mp4`
      );

      const renderResult = await RemotionRunner.render({
        sessionId,
        cameraSources,
        outputPath,
        showCaptions: true,
        showChapters: true,
        showSpeakerLabels: true,
        onProgress: async (progress) => {
          // Update progress (20% base + 70% for render + 10% for upload)
          await renderJobService.transitionStatus(renderJobId, 'processing', {
            progress: 0.2 + (progress * 0.7),
          });
        },
      });

      if (!renderResult.success) {
        throw new Error(renderResult.error || 'Render failed');
      }

      console.log(`[render-worker] Render completed, uploading artifacts for ${renderJobId}`);

      // Update progress
      await renderJobService.transitionStatus(renderJobId, 'processing', {
        progress: 0.85,
      });

      // Generate thumbnail
      const thumbnailResult = await ThumbnailGenerator.generateThumbnail(
        outputPath,
        undefined, // Auto-generate path
        3 // Extract frame at 3 seconds
      );

      // Update progress
      await renderJobService.transitionStatus(renderJobId, 'processing', {
        progress: 0.9,
      });

      // Upload artifacts to R2
      const uploadResult = await R2Upload.uploadRenderArtifacts(
        renderJobId,
        sessionId,
        outputPath
      );

      if (uploadResult.error) {
        throw new Error(`Artifact upload failed: ${uploadResult.error}`);
      }

      // Upload thumbnail if generated
      let thumbnailUrl: string | undefined;
      if (thumbnailResult.success && thumbnailResult.thumbnailPath) {
        const thumbnailKey = `renders/${sessionId}/${renderJobId}-thumb.jpg`;
        const thumbnailUpload = await R2Upload.uploadFile(
          thumbnailResult.thumbnailPath,
          thumbnailKey,
          'image/jpeg'
        );

        if (thumbnailUpload.success) {
          thumbnailUrl = thumbnailUpload.url;
        }
      }

      // Update progress
      await renderJobService.transitionStatus(renderJobId, 'processing', {
        progress: 0.95,
      });

      // Get video metadata (duration, size, resolution)
      const stats = await fs.stat(outputPath);
      const fileSizeBytes = stats.size;

      // Complete job with R2 URLs
      await renderJobService.completeJob(renderJobId, {
        outputVideoUrl: uploadResult.videoUrl!,
        outputThumbnailUrl: thumbnailUrl,
        durationMs: renderResult.durationMs,
        fileSizeBytes,
      });

      // Cleanup local files
      try {
        await fs.unlink(outputPath);
        if (thumbnailResult.thumbnailPath) {
          await fs.unlink(thumbnailResult.thumbnailPath);
        }
        console.log(`[render-worker] Cleaned up local files for ${renderJobId}`);
      } catch (cleanupError) {
        console.warn(`[render-worker] Failed to cleanup local files:`, cleanupError);
        // Don't fail job if cleanup fails
      }

      console.log(`[render-worker] Job ${renderJobId} completed successfully`);
    } catch (error: any) {
      console.error(`[render-worker] Job ${renderJobId} failed:`, error);

      await renderJobService.failJob(
        renderJobId,
        error.message || 'Unknown error during render'
      );

      throw error; // Re-throw for BullMQ retry logic
    }
  }

  /**
   * Stop worker
   */
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
