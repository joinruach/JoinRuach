/**
 * Video Render Service
 * Handles Remotion video generation with Lambda rendering
 */

import type { Core } from "@strapi/strapi";
import { Queue, Worker, Job } from "bullmq";

// Environment configuration
const REMOTION_SERVE_URL = process.env.REMOTION_SERVE_URL || "";
const REMOTION_FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME || "";
const AWS_REGION = process.env.REMOTION_AWS_REGION || "us-east-1";
const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || "";

interface RenderJobData {
  renderId: string;
  compositionId: string;
  inputProps: Record<string, unknown>;
  outputFormat: "mp4" | "webm" | "gif";
  quality: "draft" | "standard" | "high";
}

interface RenderResult {
  outputUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  renderTimeMs: number;
}

let renderQueue: Queue<RenderJobData> | null = null;
let renderWorker: Worker<RenderJobData> | null = null;

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Initialize the render queue
   */
  async initialize(): Promise<void> {
    if (!REDIS_URL) {
      strapi.log.warn("[VideoRender] Redis not configured, using in-memory processing");
      return;
    }

    try {
      const { Redis } = await import("ioredis");
      const connection = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
      });

      renderQueue = new Queue<RenderJobData>("video-render", {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });

      renderWorker = new Worker<RenderJobData>(
        "video-render",
        async (job: Job<RenderJobData>) => {
          return this.processRenderJob(job);
        },
        {
          connection,
          concurrency: 3,
        }
      );

      renderWorker.on("completed", (job, result) => {
        strapi.log.info(`[VideoRender] Job ${job.id} completed`);
      });

      renderWorker.on("failed", (job, error) => {
        strapi.log.error(`[VideoRender] Job ${job?.id} failed:`, error);
      });

      strapi.log.info("[VideoRender] Queue initialized successfully");
    } catch (error) {
      strapi.log.error("[VideoRender] Failed to initialize queue:", error);
    }
  },

  /**
   * Queue a new video render
   */
  async queueRender(params: {
    compositionId: string;
    inputProps: Record<string, unknown>;
    outputFormat?: "mp4" | "webm" | "gif";
    quality?: "draft" | "standard" | "high";
    userId: number;
    sourceContentId?: number;
  }): Promise<{ renderId: string; jobId: string }> {
    const entityService = strapi.entityService as any;
    const crypto = await import("crypto");
    const renderId = crypto.randomUUID();

    // Create database record
    const renderRecord = await entityService.create("api::video-render.video-render", {
      data: {
        renderId,
        compositionId: params.compositionId,
        status: "queued",
        progress: 0,
        inputProps: params.inputProps,
        outputFormat: params.outputFormat || "mp4",
        quality: params.quality || "standard",
        requestedBy: params.userId || null,
        sourceContent: params.sourceContentId || null,
        publishedAt: new Date(),
      },
    });

    // Queue the job
    const jobData: RenderJobData = {
      renderId,
      compositionId: params.compositionId,
      inputProps: params.inputProps,
      outputFormat: params.outputFormat || "mp4",
      quality: params.quality || "standard",
    };

    let jobId: string = renderId;

    if (renderQueue) {
      const job = await renderQueue.add("render", jobData, {
        jobId: renderId,
      });
      jobId = String(job.id ?? renderId);
    } else {
      // Process immediately if no queue
      this.processRenderJob({ id: renderId, data: jobData } as any).catch((error) => {
        strapi.log.error("[VideoRender] Direct processing failed:", error);
      });
    }

    return { renderId, jobId };
  },

  /**
   * Process a render job
   */
  async processRenderJob(job: Job<RenderJobData>): Promise<RenderResult> {
    const { renderId, compositionId, inputProps, outputFormat, quality } = job.data;
    const entityService = strapi.entityService as any;
    const startTime = Date.now();

    try {
      // Update status to rendering
      await this.updateRenderStatus(renderId, "rendering", 0);

      // Check if Lambda is configured
      if (!REMOTION_SERVE_URL || !REMOTION_FUNCTION_NAME) {
        throw new Error("Remotion Lambda not configured");
      }

      // Dynamically import Lambda client
      const {
        renderMediaOnLambda,
        getRenderProgress,
      } = await import("@remotion/lambda/client");

      // Trigger Lambda render
      const lambdaResult = await renderMediaOnLambda({
        region: AWS_REGION as any,
        functionName: REMOTION_FUNCTION_NAME,
        serveUrl: REMOTION_SERVE_URL,
        composition: compositionId,
        inputProps,
        codec: outputFormat === "webm" ? "vp8" : "h264",
        imageFormat: "jpeg",
        maxRetries: 3,
        privacy: "public",
        outName: `${renderId}.${outputFormat}`,
      });

      // Store Lambda details
      await entityService.update("api::video-render.video-render", await this.getRecordId(renderId), {
        data: {
          lambdaBucketName: lambdaResult.bucketName,
          lambdaRenderId: lambdaResult.renderId,
        },
      });

      // Poll for completion
      let progress = 0;
      let outputUrl = "";
      let done = false;

      while (!done) {
        const progressResult = await getRenderProgress({
          region: AWS_REGION as any,
          functionName: REMOTION_FUNCTION_NAME,
          bucketName: lambdaResult.bucketName,
          renderId: lambdaResult.renderId,
        });

        progress = progressResult.overallProgress * 100;
        done = progressResult.done;

        if (progressResult.outputFile) {
          outputUrl = progressResult.outputFile;
        }

        if (progressResult.errors && progressResult.errors.length > 0) {
          throw new Error(progressResult.errors.map((e) => e.message).join(", "));
        }

        // Update progress
        await this.updateRenderStatus(renderId, "rendering", progress);

        if (!done) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      const renderTimeMs = Date.now() - startTime;

      // Update final status
      await entityService.update("api::video-render.video-render", await this.getRecordId(renderId), {
        data: {
          status: "completed",
          progress: 100,
          outputUrl,
          renderTimeMs,
        },
      });

      return {
        outputUrl,
        fileSize: 0, // Lambda doesn't provide this directly
        renderTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      strapi.log.error(`[VideoRender] Render ${renderId} failed:`, error);

      await entityService.update("api::video-render.video-render", await this.getRecordId(renderId), {
        data: {
          status: "failed",
          error: errorMessage,
        },
      });

      throw error;
    }
  },

  /**
   * Update render status
   */
  async updateRenderStatus(
    renderId: string,
    status: "queued" | "rendering" | "completed" | "failed",
    progress: number
  ): Promise<void> {
    const entityService = strapi.entityService as any;
    const recordId = await this.getRecordId(renderId);

    if (recordId) {
      await entityService.update("api::video-render.video-render", recordId, {
        data: { status, progress },
      });
    }
  },

  /**
   * Get render status
   */
  async getRenderStatus(
    renderId: string,
    userId: number
  ): Promise<{
    status: string;
    progress: number;
    outputUrl?: string;
    error?: string;
  } | null> {
    const entityService = strapi.entityService as any;

    const renders = await entityService.findMany("api::video-render.video-render", {
      filters: {
        renderId,
        requestedBy: userId,
      },
      limit: 1,
    });

    const render = renders?.[0];
    if (!render) return null;

    return {
      status: render.status,
      progress: render.progress,
      outputUrl: render.outputUrl,
      error: render.error,
    };
  },

  /**
   * Get database record ID from render ID
   */
  async getRecordId(renderId: string): Promise<number | null> {
    const entityService = strapi.entityService as any;

    const renders = await entityService.findMany("api::video-render.video-render", {
      filters: { renderId },
      limit: 1,
    });

    return renders?.[0]?.id || null;
  },

  /**
   * List user's renders
   */
  async listUserRenders(
    userId: number,
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<{ renders: any[]; total: number }> {
    const entityService = strapi.entityService as any;
    const { status, limit = 20, offset = 0 } = options;

    const filters: any = { requestedBy: userId };
    if (status) {
      filters.status = status;
    }

    const renders = await entityService.findMany("api::video-render.video-render", {
      filters,
      limit,
      start: offset,
      sort: { createdAt: "desc" },
    });

    const total = await entityService.count("api::video-render.video-render", {
      filters,
    });

    return { renders, total };
  },

  /**
   * Cancel a render
   */
  async cancelRender(renderId: string, userId: number): Promise<boolean> {
    const entityService = strapi.entityService as any;

    // Find render with ownership check
    const renders = await entityService.findMany("api::video-render.video-render", {
      filters: {
        renderId,
        requestedBy: userId,
      },
      limit: 1,
    });

    const recordId = renders?.[0]?.id;
    if (!recordId) return false;

    // Update status
    await entityService.update("api::video-render.video-render", recordId, {
      data: {
        status: "failed",
        error: "Cancelled by user",
      },
    });

    // Remove from queue if present
    if (renderQueue) {
      const job = await renderQueue.getJob(renderId);
      if (job) {
        await job.remove();
      }
    }

    return true;
  },

  /**
   * Cleanup old renders
   */
  async cleanupOldRenders(daysOld: number = 30): Promise<number> {
    const entityService = strapi.entityService as any;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldRenders = await entityService.findMany("api::video-render.video-render", {
      filters: {
        createdAt: { $lt: cutoffDate.toISOString() },
        status: { $in: ["completed", "failed"] },
      },
      limit: 100,
    });

    let deleted = 0;
    for (const render of oldRenders || []) {
      await entityService.delete("api::video-render.video-render", render.id);
      deleted++;
    }

    return deleted;
  },

  /**
   * Get queue stats
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    if (!renderQueue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }

    const [waiting, active, completed, failed] = await Promise.all([
      renderQueue.getWaitingCount(),
      renderQueue.getActiveCount(),
      renderQueue.getCompletedCount(),
      renderQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  },
});
