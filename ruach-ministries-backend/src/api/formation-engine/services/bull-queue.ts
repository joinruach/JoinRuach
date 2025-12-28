/**
 * BullMQ Queue Service
 * Handles async job processing for formation state and AI analysis
 */

import type { Strapi } from '@strapi/strapi';
import { Queue, Worker, type Job } from 'bullmq';
import { createClient } from 'redis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

interface StateRecomputationJob {
  userId: string | number;
  eventId: string;
}

interface ReflectionAnalysisJob {
  reflectionId: string;
}

let stateQueue: Queue | null = null;
let analysisQueue: Queue | null = null;
let stateWorker: Worker | null = null;
let analysisWorker: Worker | null = null;

export default ({ strapi }: { strapi: Strapi }) => ({
  /**
   * Initialize BullMQ queues and workers
   */
  async initialize() {
    try {
      const connection = {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
      };

      // Create queues
      stateQueue = new Queue('formation-state-recomputation', { connection });
      analysisQueue = new Queue('reflection-analysis', { connection });

      strapi.log.info('✅ BullMQ queues initialized');

      // Start workers
      this.startWorkers();

      strapi.log.info('✅ BullMQ workers started');
    } catch (error) {
      strapi.log.error('Failed to initialize BullMQ:', error);
      throw error;
    }
  },

  /**
   * Start background workers
   */
  startWorkers() {
    const connection = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
    };

    // State recomputation worker
    stateWorker = new Worker(
      'formation-state-recomputation',
      async (job: Job<StateRecomputationJob>) => {
        strapi.log.info(`Processing state recomputation for user: ${job.data.userId}`);

        try {
          await strapi.service('api::formation-engine.formation-engine').recomputeFormationState(job.data.userId);
          strapi.log.info(`✅ State recomputed for user: ${job.data.userId}`);
        } catch (error) {
          strapi.log.error(`Error recomputing state for user ${job.data.userId}:`, error);
          throw error;
        }
      },
      {
        connection,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    );

    // Reflection analysis worker
    analysisWorker = new Worker(
      'reflection-analysis',
      async (job: Job<ReflectionAnalysisJob>) => {
        strapi.log.info(`Processing reflection analysis: ${job.data.reflectionId}`);

        try {
          // Get reflection
          const reflections = await strapi.entityService.findMany('api::formation-reflection.formation-reflection', {
            filters: { reflectionId: { $eq: job.data.reflectionId } },
            populate: ['user'],
          });

          if (!Array.isArray(reflections) || reflections.length === 0) {
            throw new Error(`Reflection not found: ${job.data.reflectionId}`);
          }

          const reflection = reflections[0];

          // Get user's phase
          const userId = reflection.user?.id || reflection.anonymousUserId;
          const journeyFilters: any = reflection.user
            ? { user: { id: userId } }
            : { anonymousUserId: { $eq: userId } };

          const journey = await strapi.entityService.findMany('api::formation-journey.formation-journey', {
            filters: journeyFilters,
          });

          const userPhase = Array.isArray(journey) && journey.length > 0
            ? journey[0].currentPhase
            : 'awakening';

          // Analyze reflection
          await strapi.service('api::formation-engine.ai-sharpening').analyzeReflection(
            job.data.reflectionId,
            reflection.content,
            userPhase,
            reflection.checkpointId
          );

          strapi.log.info(`✅ Reflection analyzed: ${job.data.reflectionId}`);
        } catch (error) {
          strapi.log.error(`Error analyzing reflection ${job.data.reflectionId}:`, error);
          throw error;
        }
      },
      {
        connection,
        concurrency: 3, // Limit concurrency due to Claude API rate limits
        limiter: {
          max: 5,
          duration: 1000,
        },
      }
    );

    // Worker error handling
    stateWorker.on('failed', (job, err) => {
      strapi.log.error(`State recomputation job ${job?.id} failed:`, err);
    });

    analysisWorker.on('failed', (job, err) => {
      strapi.log.error(`Reflection analysis job ${job?.id} failed:`, err);
    });
  },

  /**
   * Enqueue state recomputation job
   */
  async enqueueStateRecomputation(data: StateRecomputationJob) {
    if (!stateQueue) {
      throw new Error('State queue not initialized');
    }

    await stateQueue.add('recompute-state', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    strapi.log.info(`Enqueued state recomputation for user: ${data.userId}`);
  },

  /**
   * Enqueue reflection analysis job
   */
  async enqueueReflectionAnalysis(data: ReflectionAnalysisJob) {
    if (!analysisQueue) {
      throw new Error('Analysis queue not initialized');
    }

    await analysisQueue.add('analyze-reflection', data, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });

    strapi.log.info(`Enqueued reflection analysis: ${data.reflectionId}`);
  },

  /**
   * Get queue statistics
   */
  async getStats() {
    if (!stateQueue || !analysisQueue) {
      return { state: null, analysis: null };
    }

    const [stateWaiting, stateFailed, analysisWaiting, analysisFailed] = await Promise.all([
      stateQueue.getWaitingCount(),
      stateQueue.getFailedCount(),
      analysisQueue.getWaitingCount(),
      analysisQueue.getFailedCount(),
    ]);

    return {
      state: {
        waiting: stateWaiting,
        failed: stateFailed,
      },
      analysis: {
        waiting: analysisWaiting,
        failed: analysisFailed,
      },
    };
  },

  /**
   * Graceful shutdown
   */
  async shutdown() {
    strapi.log.info('Shutting down BullMQ workers...');

    if (stateWorker) {
      await stateWorker.close();
    }

    if (analysisWorker) {
      await analysisWorker.close();
    }

    if (stateQueue) {
      await stateQueue.close();
    }

    if (analysisQueue) {
      await analysisQueue.close();
    }

    strapi.log.info('✅ BullMQ shutdown complete');
  },
});
