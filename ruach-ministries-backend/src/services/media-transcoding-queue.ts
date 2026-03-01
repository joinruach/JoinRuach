import type { Core } from "@strapi/strapi";
import { Queue, Worker, type Job } from "bullmq";
import type { RedisOptions } from "ioredis";
import * as fs from "fs";
import * as path from "path";

/**
 * Transcoding job types and their payloads
 * Phase 9 additions: proxy, mezzanine, extract-audio-wav
 */
export type TranscodingJobType =
  | "transcode"
  | "thumbnail"
  | "extract-audio"
  | "proxy"           // Phase 9: Web scrubbing proxy with -g 2
  | "mezzanine"       // Phase 9: ProRes mezzanine for Remotion
  | "extract-audio-wav"; // Phase 9: Uncompressed WAV for audio-offset-finder

export interface TranscodingJobData {
  type: TranscodingJobType;
  mediaItemId: number;
  sourceFileUrl: string;
  sourceFileName: string;
  mediaType: "video" | "audio";

  // For transcode jobs
  resolutions?: Array<{
    width: number;
    height: number;
    bitrate: string;
    label: string; // "1080p", "720p", "480p"
  }>;

  // For thumbnail jobs
  thumbnailTimestamps?: number[]; // seconds into video (10%, 30%, 50%)

  // For audio extraction
  audioFormat?: string; // "mp3", "aac", etc.

  // Storage
  r2BucketName: string;
  r2OutputPath: string;

  // Optional: link to media-asset for propagating results (e.g. WAV URL)
  mediaAssetDocumentId?: string;
}

export interface TranscodingJobProgress {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  currentTask?: string;
  errors?: string[];
  results?: {
    transcodes?: Array<{
      resolution: string;
      outputUrl: string;
      fileSize: number;
      duration: number;
    }>;
    thumbnails?: Array<{
      timestamp: number;
      outputUrl: string;
      fileSize: number;
    }>;
    audio?: {
      outputUrl: string;
      fileSize: number;
      duration: number;
    };
    // Phase 9: New result types
    proxy?: {
      outputUrl: string;
      fileSize: number;
      duration: number;
      resolution: string;
    };
    mezzanine?: {
      outputUrl: string;
      fileSize: number;
      duration: number;
      codec: string;
    };
    audioWav?: {
      outputUrl: string;
      fileSize: number;
      duration: number;
      sampleRate: number;
      channels: number;
    };
    vfrDetected?: boolean;
    vfrConverted?: boolean;
  };
  startedAt?: Date;
  completedAt?: Date;
}

type TranscodingQueue = Queue<
  TranscodingJobData,
  TranscodingJobProgress,
  string,
  TranscodingJobData,
  any,
  string
>;

let queue: TranscodingQueue | null = null;
let worker: Worker<TranscodingJobData, TranscodingJobProgress> | null = null;

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_TLS = process.env.REDIS_TLS === "true";

function createRedisConnection(): RedisOptions {
  const options: RedisOptions = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  };
  if (REDIS_TLS) {
    options.tls = {};
  }
  return options;
}

/**
 * Update media-asset's r2_audio_wav_url after WAV extraction completes.
 * Uses knex directly to match existing DB access patterns.
 */
async function propagateAudioWavUrl(
  strapi: Core.Strapi,
  mediaAssetDocumentId: string,
  wavUrl: string,
): Promise<void> {
  const knex = strapi.db.connection;
  const updated = await knex("media_assets")
    .where("document_id", mediaAssetDocumentId)
    .update({
      r_2_audio_wav_url: wavUrl,
      updated_at: new Date().toISOString(),
    });

  if (updated === 0) {
    strapi.log.warn(
      `[media-transcoding] No media-asset found with documentId=${mediaAssetDocumentId}`,
    );
    return;
  }

  strapi.log.info(
    `[media-transcoding] Updated media-asset ${mediaAssetDocumentId} with WAV URL`,
  );
}

/**
 * Initialize the media transcoding queue
 */
export async function initializeMediaTranscodingQueue({
  strapi,
}: {
  strapi: Core.Strapi;
}) {
  if (queue && worker) return;

  try {
    const connection = createRedisConnection();
    const queueName = "media-transcoding";

    queue = new Queue<
      TranscodingJobData,
      TranscodingJobProgress,
      string,
      TranscodingJobData,
      any,
      string
    >(queueName, {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 60_000 }, // 1 minute initial delay
        removeOnComplete: { age: 24 * 3600 }, // Keep for 24 hours
        removeOnFail: { age: 7 * 24 * 3600 }, // Keep failures for 7 days
      },
    });

    worker = new Worker<TranscodingJobData, TranscodingJobProgress>(
      queueName,
      async (job: Job<TranscodingJobData>) => {
        strapi.log.info(`[transcode-worker] Processing job ${job.id}`);

        try {
          // Update progress
          await job.updateProgress({
            jobId: job.id!,
            status: "processing",
            progress: 5,
            currentTask: "Initializing transcoding",
            startedAt: new Date(),
          });

          // Delegate to transcode-worker service based on job type
          const transcodeWorkerService = strapi.service(
            "api::media-transcoding.transcode-worker"
          ) as any;

          if (!transcodeWorkerService) {
            throw new Error("Transcode worker service not initialized");
          }

          const results = await transcodeWorkerService.processTranscodingJob(
            job,
            (progress: number, task: string) => {
              return job.updateProgress({
                jobId: job.id!,
                status: "processing",
                progress,
                currentTask: task,
              });
            }
          );

          // Mark as completed
          await job.updateProgress({
            jobId: job.id!,
            status: "completed",
            progress: 100,
            currentTask: "Completed",
            results,
            completedAt: new Date(),
          });

          return results;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          strapi.log.error(`[transcode-worker] Job ${job.id} failed:`, error);

          await job.updateProgress({
            jobId: job.id!,
            status: "failed",
            progress: 0,
            errors: [errorMessage],
            completedAt: new Date(),
          });

          throw error;
        }
      },
      { connection, concurrency: 1 } // Process one transcoding job at a time
    );

    worker.on("failed", (job, err) => {
      strapi.log.error(
        `[media-transcoding] Job ${job?.id} failed:`,
        err.message
      );
    });

    worker.on("completed", async (job) => {
      strapi.log.info(`[media-transcoding] Job ${job.id} completed`);

      // Propagate audioWav URL to linked media-asset
      const result = job.returnvalue;
      if (result?.results?.audioWav?.outputUrl && job.data.mediaAssetDocumentId) {
        try {
          await propagateAudioWavUrl(
            strapi,
            job.data.mediaAssetDocumentId,
            result.results.audioWav.outputUrl,
          );
        } catch (err) {
          strapi.log.error(
            `[media-transcoding] Failed to propagate WAV URL for asset ${job.data.mediaAssetDocumentId}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    });

    strapi.log.info("✅ Media transcoding queue initialized");
  } catch (error) {
    strapi.log.error(
      "❌ Failed to initialize media transcoding queue",
      error
    );
  }
}

/**
 * Enqueue a transcoding job
 */
export async function enqueueTranscodingJob(
  strapi: Core.Strapi,
  jobData: TranscodingJobData
): Promise<string | null> {
  if (!queue) {
    strapi.log.warn(
      "[media-transcoding] Queue not initialized; skipping enqueue"
    );
    return null;
  }

  try {
    const jobId = `transcode:${jobData.mediaItemId}:${jobData.type}:${Date.now()}`;

    const job = await queue.add(jobData.type, jobData, {
      jobId,
      priority:
        jobData.type === "transcode"
          ? 10
          : jobData.type === "proxy" || jobData.type === "mezzanine"
            ? 8  // Phase 9: High priority for proxies/mezzanines
            : jobData.type === "extract-audio-wav"
              ? 7  // Phase 9: High priority for sync audio
              : jobData.type === "thumbnail"
                ? 5
                : 1,
    });

    strapi.log.info(
      `[media-transcoding] Enqueued ${jobData.type} job for media ${jobData.mediaItemId}`
    );

    return job.id || jobId;
  } catch (error) {
    strapi.log.error(
      `[media-transcoding] Failed to enqueue job:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Get job status
 */
export async function getTranscodingJobStatus(
  strapi: Core.Strapi,
  jobId: string
): Promise<TranscodingJobProgress | null> {
  if (!queue) {
    return null;
  }

  try {
    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const progress = job.progress;
    return (progress as TranscodingJobProgress) || {
      jobId,
      status: "pending",
      progress: 0,
    };
  } catch (error) {
    strapi.log.error(
      `[media-transcoding] Failed to get job status:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * List all transcoding jobs for a media item
 */
export async function listMediaTranscodingJobs(
  strapi: Core.Strapi,
  mediaItemId: number
): Promise<Array<{ jobId: string; type: TranscodingJobType; status: string }>> {
  if (!queue) {
    return [];
  }

  try {
    const jobs = await queue.getJobs(["waiting", "active", "completed", "failed"]);
    const filteredJobs = jobs.filter((job) => job.data.mediaItemId === mediaItemId);

    const jobsWithStatus = await Promise.all(
      filteredJobs.map(async (job) => ({
        jobId: job.id!,
        type: job.data.type,
        status: await job.getState(),
      }))
    );
    return jobsWithStatus;
  } catch (error) {
    strapi.log.error(
      `[media-transcoding] Failed to list jobs:`,
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

/**
 * Shutdown the queue and worker
 */
export async function shutdownMediaTranscodingQueue() {
  if (worker) {
    await worker.close();
  }
  if (queue) {
    await queue.close();
  }
}
