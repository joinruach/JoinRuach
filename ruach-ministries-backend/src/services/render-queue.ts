/**
 * Phase 13 Plan 2: Render Queue Service
 *
 * BullMQ queue for async render job processing
 */

import { Queue } from 'bullmq';
import Redis from 'ioredis';

export interface RenderJobPayload {
  renderJobId: string;
  sessionId: string;
  format: string;
}

export default class RenderQueue {
  private static queue: Queue<RenderJobPayload> | null = null;
  private static connection: Redis | null = null;

  /**
   * Initialize queue connection
   */
  static async initialize() {
    if (this.queue) {
      return this.queue;
    }

    // Redis connection
    this.connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null, // Required for BullMQ
    });

    // Create queue
    this.queue = new Queue<RenderJobPayload>('render-jobs', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, 25s, 125s
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep for 24 hours
          count: 100,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep for 7 days
        },
      },
    });

    console.log('[render-queue] Initialized BullMQ queue');

    return this.queue;
  }

  /**
   * Add job to queue
   *
   * @param payload - Job data
   * @returns BullMQ job ID
   */
  static async addJob(payload: RenderJobPayload, isRetry = false): Promise<string> {
    const queue = await this.initialize();

    // For retries, append a suffix to avoid BullMQ duplicate job ID rejection
    // (failed jobs stay in Redis for 7 days per removeOnFail config)
    const jobId = isRetry
      ? `${payload.renderJobId}-retry-${Date.now()}`
      : payload.renderJobId;

    const job = await queue.add('render-video', payload, {
      jobId,
    });

    console.log(`[render-queue] Added job ${job.id} to queue`);

    return job.id!;
  }

  /**
   * Get queue instance
   */
  static async getQueue(): Promise<Queue<RenderJobPayload>> {
    return await this.initialize();
  }

  /**
   * Close queue connection
   */
  static async close() {
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
    if (this.connection) {
      await this.connection.quit();
      this.connection = null;
    }
    console.log('[render-queue] Queue closed');
  }
}
