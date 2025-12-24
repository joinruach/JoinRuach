/**
 * Ruach Publisher - Bootstrap
 *
 * Initializes the BullMQ queue and workers when Strapi starts
 */

'use strict';

const { Queue, Worker } = require('bullmq');
const logger = require('../../../config/logger');

let publishQueue;
let publishWorker;

module.exports = async ({ strapi }) => {
  logger.logApp('Ruach Publisher: Initializing...');

  // Redis configuration
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required for BullMQ
  };

  logger.info('Connecting to Redis for job queue', {
    category: 'publisher',
    host: redisConfig.host,
    port: redisConfig.port,
  });

  try {
    // Create BullMQ queue for publishing jobs
    publishQueue = new Queue('ruach-publisher', {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: 3, // Retry failed jobs up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 second delay
        },
        removeOnComplete: {
          count: 100, // Keep last 100 successful jobs
          age: 24 * 3600, // Keep for 24 hours
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs
          age: 7 * 24 * 3600, // Keep for 7 days
        },
      },
    });

    // Create worker to process publishing jobs
    publishWorker = new Worker(
      'ruach-publisher',
      async (job) => {
        const { mediaItem, platform } = job.data;

        logger.info(`Processing publish job: ${job.id}`, {
          category: 'publisher',
          mediaItemId: mediaItem.id,
          mediaItemTitle: mediaItem.title,
          platform,
          attempt: job.attemptsMade + 1,
        });

        // Get the appropriate provider
        const providerService = strapi
          .plugin('ruach-publisher')
          .service('providers')
          .getProvider(platform);

        if (!providerService) {
          throw new Error(`Provider not found for platform: ${platform}`);
        }

        // Execute the publish
        const result = await providerService.publish(mediaItem);

        logger.info(`Successfully published to ${platform}`, {
          category: 'publisher',
          mediaItemId: mediaItem.id,
          platform,
          result,
        });

        return result;
      },
      {
        connection: redisConfig,
        concurrency: 5, // Process up to 5 jobs concurrently
      }
    );

    // Worker event handlers
    publishWorker.on('completed', async (job, result) => {
      logger.info(`Job completed: ${job.id}`, {
        category: 'publisher',
        jobId: job.id,
        platform: job.data.platform,
        result,
      });

      // Update publishStatus in media-item
      await updatePublishStatus(job.data.mediaItem.id, job.data.platform, {
        status: 'success',
        publishedAt: new Date().toISOString(),
        result,
      });
    });

    publishWorker.on('failed', async (job, error) => {
      const { mediaItem, platform } = job.data;
      const attemptsMade = job.attemptsMade || 0;
      const maxAttempts = 3;
      const isFinalFailure = attemptsMade >= maxAttempts;

      logger.error(`Job failed: ${job.id}`, {
        category: 'publisher',
        jobId: job.id,
        platform,
        error: error.message,
        stack: error.stack,
        attemptsMade,
        isFinalFailure,
      });

      // Update publishStatus in media-item
      await updatePublishStatus(mediaItem.id, platform, {
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString(),
        attempts: attemptsMade,
      });

      // Send failure notification
      try {
        const notificationService = strapi
          .plugin('ruach-publisher')
          .service('notifications');

        if (isFinalFailure) {
          // All retries exhausted - send urgent notification
          await notificationService.notifyFinalFailure(
            mediaItem,
            platform,
            error,
            maxAttempts
          );
        } else {
          // Still retrying - send standard notification
          await notificationService.notifyPublishingFailure(
            mediaItem,
            platform,
            error,
            attemptsMade
          );
        }
      } catch (notificationError) {
        // Don't let notification failures break the workflow
        logger.error('Failed to send failure notification', {
          category: 'publisher',
          error: notificationError.message,
        });
      }
    });

    publishWorker.on('error', (error) => {
      logger.error('Worker error:', {
        category: 'publisher',
        error: error.message,
        stack: error.stack,
      });
    });

    // Store queue reference in strapi instance
    strapi.ruachPublisher = {
      queue: publishQueue,
      worker: publishWorker,
    };

    logger.logApp('Ruach Publisher: Initialized successfully', {
      redisHost: redisConfig.host,
      redisPort: redisConfig.port,
    });
  } catch (error) {
    logger.error('Failed to initialize Ruach Publisher:', {
      category: 'publisher',
      error: error.message,
      stack: error.stack,
      redisConfig: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
    });

    logger.warn(
      '⚠️ Ruach Publisher will NOT be available. Auto-publishing is DISABLED.',
      {
        category: 'publisher',
        help: 'Ensure Redis is running and accessible at the configured host and port.',
      }
    );

    // Store null reference to indicate publisher is not available
    strapi.ruachPublisher = null;
  }
};

/**
 * Update the publishStatus field in a media-item
 */
async function updatePublishStatus(mediaItemId, platform, status) {
  try {
    // Fetch current media-item
    const mediaItem = await strapi.entityService.findOne(
      'api::media-item.media-item',
      mediaItemId,
      { fields: ['publishStatus'] }
    );

    const currentStatus = mediaItem?.publishStatus || {};

    // Update status for this platform
    currentStatus[platform] = {
      ...(currentStatus[platform] || {}),
      ...status,
    };

    // Save updated status
    await strapi.entityService.update('api::media-item.media-item', mediaItemId, {
      data: {
        publishStatus: currentStatus,
      },
    });

    logger.debug('Updated publish status', {
      category: 'publisher',
      mediaItemId,
      platform,
      status,
    });
  } catch (error) {
    logger.error('Failed to update publish status:', {
      category: 'publisher',
      mediaItemId,
      platform,
      error: error.message,
    });
  }
}
