/**
 * Ruach Async Generation Service
 * BullMQ-based job queue for long-running AI generation tasks
 */

import type { Core } from '@strapi/strapi';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const QUEUE_NAME = 'ruach-generation';

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface GenerationJobData {
  jobId: string;
  requestId: string;
  query: string;
  outputType: 'sermon' | 'study' | 'qa_answer' | 'doctrine_page';
  mode: 'scripture_library' | 'scripture_only' | 'teaching_voice';
  templateId?: string;
  filters?: {
    categories?: string[];
    authorRestrictions?: string[];
  };
  retrievalLimit?: number;
  relevanceThreshold?: number;
  strictMode?: boolean;
  userId?: string;
  priority?: number;
  webhookUrl?: string;
}

interface GenerationJobResult {
  nodeId: string;
  status: 'success' | 'partial' | 'failed';
  content: string;
  citations: any[];
  qualityMetrics: any;
  warnings: any[];
  errors: string[];
  metadata: {
    generationTimeMs: number;
    model: string;
    tokensUsed: number;
  };
}

interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
  result?: GenerationJobResult;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedTimeMs?: number;
}

// Redis connection config
function getRedisConnection() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Upstash requires special connection handling
    return {
      host: new URL(process.env.UPSTASH_REDIS_REST_URL).hostname,
      port: 6379,
      password: process.env.UPSTASH_REDIS_REST_TOKEN,
      tls: {},
    };
  }

  if (REDIS_URL) {
    const url = new URL(REDIS_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
    };
  }

  return null;
}

// In-memory fallback for development
const inMemoryJobs = new Map<string, {
  data: GenerationJobData;
  status: JobStatus;
  progress: number;
  result?: GenerationJobResult;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}>();

export default ({ strapi }: { strapi: Core.Strapi }) => {
  let queue: Queue | null = null;
  let worker: Worker | null = null;
  let queueEvents: QueueEvents | null = null;
  let isInitialized = false;

  const service = {
    /**
     * Initialize the queue and worker
     */
    async initialize(): Promise<boolean> {
      if (isInitialized) return true;

      const connection = getRedisConnection();

      if (!connection) {
        strapi.log.warn('[AsyncGeneration] No Redis connection - using in-memory fallback');
        isInitialized = true;
        return true;
      }

      try {
        // Create queue
        queue = new Queue(QUEUE_NAME, { connection });

        // Create worker
        worker = new Worker(
          QUEUE_NAME,
          async (job: Job<GenerationJobData>) => {
            return await this.processJob(job);
          },
          {
            connection,
            concurrency: 2, // Process 2 jobs concurrently
            limiter: {
              max: 10,
              duration: 60000, // 10 jobs per minute max
            },
          }
        );

        // Event listeners
        worker.on('completed', (job, result) => {
          strapi.log.info(`[AsyncGeneration] Job ${job.id} completed`);
          this.notifyWebhook(job.data.webhookUrl, 'completed', result);
        });

        worker.on('failed', (job, error) => {
          strapi.log.error(`[AsyncGeneration] Job ${job?.id} failed:`, error);
          if (job) {
            this.notifyWebhook(job.data.webhookUrl, 'failed', { error: error.message });
          }
        });

        worker.on('progress', (job, progress) => {
          strapi.log.debug(`[AsyncGeneration] Job ${job.id} progress: ${progress}%`);
        });

        // Queue events for monitoring
        queueEvents = new QueueEvents(QUEUE_NAME, { connection });

        isInitialized = true;
        strapi.log.info('[AsyncGeneration] Queue initialized successfully');
        return true;
      } catch (error) {
        strapi.log.error('[AsyncGeneration] Failed to initialize queue:', error);
        return false;
      }
    },

    /**
     * Queue a new generation job
     */
    async queueGeneration(request: Omit<GenerationJobData, 'jobId'>): Promise<{ jobId: string; estimatedTimeMs: number }> {
      const crypto = await import('crypto');
      const jobId = crypto.randomUUID();
      const jobData: GenerationJobData = { ...request, jobId };

      // Estimate time based on output type
      const estimatedTimeMs = this.estimateTime(request.outputType);

      if (queue) {
        // Use BullMQ
        await queue.add('generate', jobData, {
          jobId,
          priority: request.priority || 0,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 100,
          },
          removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours
          },
        });
      } else {
        // In-memory fallback
        inMemoryJobs.set(jobId, {
          data: jobData,
          status: 'pending',
          progress: 0,
          createdAt: new Date(),
        });

        // Process in background (non-blocking)
        setImmediate(() => this.processInMemoryJob(jobId));
      }

      strapi.log.info(`[AsyncGeneration] Queued job ${jobId} for ${request.outputType}`);

      return { jobId, estimatedTimeMs };
    },

    /**
     * Get job status
     */
    async getJobStatus(jobId: string): Promise<JobStatusResponse | null> {
      if (queue) {
        const job = await queue.getJob(jobId);
        if (!job) return null;

        const state = await job.getState();
        const progress = job.progress as number || 0;

        return {
          jobId,
          status: this.mapBullMQState(state),
          progress,
          result: state === 'completed' ? job.returnvalue : undefined,
          error: state === 'failed' ? job.failedReason : undefined,
          createdAt: new Date(job.timestamp).toISOString(),
          startedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
          completedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
          estimatedTimeMs: this.estimateTime(job.data.outputType),
        };
      } else {
        // In-memory fallback
        const job = inMemoryJobs.get(jobId);
        if (!job) return null;

        return {
          jobId,
          status: job.status,
          progress: job.progress,
          result: job.result,
          error: job.error,
          createdAt: job.createdAt.toISOString(),
          startedAt: job.startedAt?.toISOString(),
          completedAt: job.completedAt?.toISOString(),
          estimatedTimeMs: this.estimateTime(job.data.outputType),
        };
      }
    },

    /**
     * Cancel a pending job
     */
    async cancelJob(jobId: string): Promise<boolean> {
      if (queue) {
        const job = await queue.getJob(jobId);
        if (!job) return false;

        const state = await job.getState();
        if (state === 'waiting' || state === 'delayed') {
          await job.remove();
          return true;
        }
        return false;
      } else {
        const job = inMemoryJobs.get(jobId);
        if (job && job.status === 'pending') {
          inMemoryJobs.delete(jobId);
          return true;
        }
        return false;
      }
    },

    /**
     * List jobs with optional filters
     */
    async listJobs(options: {
      status?: JobStatus;
      limit?: number;
      offset?: number;
    } = {}): Promise<JobStatusResponse[]> {
      const { status, limit = 20, offset = 0 } = options;

      if (queue) {
        let jobs: Job[] = [];

        if (!status || status === 'pending') {
          jobs = [...jobs, ...(await queue.getWaiting(offset, offset + limit))];
        }
        if (!status || status === 'processing') {
          jobs = [...jobs, ...(await queue.getActive(offset, offset + limit))];
        }
        if (!status || status === 'completed') {
          jobs = [...jobs, ...(await queue.getCompleted(offset, offset + limit))];
        }
        if (!status || status === 'failed') {
          jobs = [...jobs, ...(await queue.getFailed(offset, offset + limit))];
        }

        return Promise.all(jobs.map(async (job) => ({
          jobId: job.id!,
          status: this.mapBullMQState(await job.getState()),
          progress: job.progress as number || 0,
          result: job.returnvalue,
          error: job.failedReason,
          createdAt: new Date(job.timestamp).toISOString(),
          startedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
          completedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
          estimatedTimeMs: this.estimateTime(job.data.outputType),
        })));
      } else {
        // In-memory fallback
        let jobs = Array.from(inMemoryJobs.entries());

        if (status) {
          jobs = jobs.filter(([_, job]) => job.status === status);
        }

        return jobs.slice(offset, offset + limit).map(([jobId, job]) => ({
          jobId,
          status: job.status,
          progress: job.progress,
          result: job.result,
          error: job.error,
          createdAt: job.createdAt.toISOString(),
          startedAt: job.startedAt?.toISOString(),
          completedAt: job.completedAt?.toISOString(),
          estimatedTimeMs: this.estimateTime(job.data.outputType),
        }));
      }
    },

    /**
     * Get queue statistics
     */
    async getQueueStats(): Promise<{
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    }> {
      if (queue) {
        const counts = await queue.getJobCounts();
        return {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
        };
      } else {
        const jobs = Array.from(inMemoryJobs.values());
        return {
          waiting: jobs.filter(j => j.status === 'pending').length,
          active: jobs.filter(j => j.status === 'processing').length,
          completed: jobs.filter(j => j.status === 'completed').length,
          failed: jobs.filter(j => j.status === 'failed').length,
          delayed: 0,
        };
      }
    },

    /**
     * Process a generation job
     */
    async processJob(job: Job<GenerationJobData>): Promise<GenerationJobResult> {
      const { data } = job;

      try {
        // Update progress: starting
        await job.updateProgress(10);

        // Get the sync generation service
        const generationService = strapi.service('api::library.ruach-generation') as any;

        // Update progress: retrieving
        await job.updateProgress(30);

        // Generate content
        const result = await generationService.generateContent({
          query: data.query,
          outputType: data.outputType,
          mode: data.mode,
          templateId: data.templateId,
          filters: data.filters,
          retrievalLimit: data.retrievalLimit,
          relevanceThreshold: data.relevanceThreshold,
          strictMode: data.strictMode,
        });

        // Update progress: complete
        await job.updateProgress(100);

        // Store job reference in generated node
        if (result.nodeId) {
          try {
            const entityService = strapi.entityService as any;
            await entityService.update('api::library-generated-node.library-generated-node', result.nodeId, {
              data: {
                asyncJobId: data.jobId,
                generatedBy: data.userId,
              },
            });
          } catch (error) {
            strapi.log.warn('Failed to update generated node with job ID:', error);
          }
        }

        return result;
      } catch (error: any) {
        strapi.log.error(`[AsyncGeneration] Job ${data.jobId} failed:`, error);
        throw error;
      }
    },

    /**
     * Process in-memory job (fallback)
     */
    async processInMemoryJob(jobId: string): Promise<void> {
      const job = inMemoryJobs.get(jobId);
      if (!job) return;

      job.status = 'processing';
      job.startedAt = new Date();
      job.progress = 10;

      try {
        const generationService = strapi.service('api::library.ruach-generation') as any;

        job.progress = 30;

        const result = await generationService.generateContent({
          query: job.data.query,
          outputType: job.data.outputType,
          mode: job.data.mode,
          templateId: job.data.templateId,
          filters: job.data.filters,
          retrievalLimit: job.data.retrievalLimit,
          relevanceThreshold: job.data.relevanceThreshold,
          strictMode: job.data.strictMode,
        });

        job.status = 'completed';
        job.progress = 100;
        job.result = result;
        job.completedAt = new Date();

        // Notify webhook if provided
        this.notifyWebhook(job.data.webhookUrl, 'completed', result);
      } catch (error: any) {
        job.status = 'failed';
        job.error = error.message;
        job.completedAt = new Date();

        this.notifyWebhook(job.data.webhookUrl, 'failed', { error: error.message });
      }
    },

    /**
     * Notify webhook of job completion/failure
     */
    async notifyWebhook(
      webhookUrl: string | undefined,
      status: 'completed' | 'failed',
      data: any
    ): Promise<void> {
      if (!webhookUrl) return;

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, data, timestamp: new Date().toISOString() }),
        });
      } catch (error) {
        strapi.log.warn('[AsyncGeneration] Failed to notify webhook:', error);
      }
    },

    /**
     * Estimate generation time based on output type
     */
    estimateTime(outputType: string): number {
      const estimates: Record<string, number> = {
        qa_answer: 15000, // 15 seconds
        study: 25000, // 25 seconds
        sermon: 35000, // 35 seconds
        doctrine_page: 45000, // 45 seconds
      };
      return estimates[outputType] || 30000;
    },

    /**
     * Map BullMQ state to our status
     */
    mapBullMQState(state: string): JobStatus {
      const mapping: Record<string, JobStatus> = {
        waiting: 'pending',
        delayed: 'pending',
        active: 'processing',
        completed: 'completed',
        failed: 'failed',
      };
      return mapping[state] || 'pending';
    },

    /**
     * Graceful shutdown
     */
    async shutdown(): Promise<void> {
      if (worker) {
        await worker.close();
      }
      if (queueEvents) {
        await queueEvents.close();
      }
      if (queue) {
        await queue.close();
      }
      strapi.log.info('[AsyncGeneration] Queue shutdown complete');
    },
  };

  return service;
};
