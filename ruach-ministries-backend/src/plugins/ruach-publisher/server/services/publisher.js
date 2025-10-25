/**
 * Ruach Publisher Service
 *
 * Main service for distributing media items to social platforms
 */

'use strict';

const logger = require('../../../../config/logger');

module.exports = ({ strapi }) => ({
  /**
   * Distribute a media item to all configured platforms
   *
   * @param {object} mediaItem - The media item to publish
   * @returns {Promise<object>} - Summary of queued jobs
   */
  async distribute(mediaItem) {
    logger.info('Distributing media item to platforms', {
      category: 'publisher',
      mediaItemId: mediaItem.id,
      mediaItemTitle: mediaItem.title,
      platforms: mediaItem.platforms,
    });

    const { queue } = strapi.ruachPublisher || {};

    if (!queue) {
      throw new Error('Publisher queue not initialized. Is Redis running?');
    }

    // Validate platforms array
    if (!mediaItem.platforms || !Array.isArray(mediaItem.platforms) || mediaItem.platforms.length === 0) {
      logger.warn('No platforms configured for media item', {
        category: 'publisher',
        mediaItemId: mediaItem.id,
      });
      return { queued: 0, platforms: [] };
    }

    const jobPromises = [];
    const enabledPlatforms = [];

    // Queue a job for each platform
    for (const platformConfig of mediaItem.platforms) {
      const { platform, enabled } = platformConfig;

      if (!enabled) {
        logger.debug(`Platform ${platform} is disabled, skipping`, {
          category: 'publisher',
          mediaItemId: mediaItem.id,
          platform,
        });
        continue;
      }

      // Add job to queue
      const jobPromise = queue.add(
        `publish-${platform}`,
        {
          mediaItem: {
            id: mediaItem.id,
            title: mediaItem.title,
            shortDescription: mediaItem.shortDescription || mediaItem.description,
            description: mediaItem.description,
            hashtags: mediaItem.hashtags,
            videoUrl: mediaItem.videoUrl,
            thumbnail: mediaItem.socialThumbnail || mediaItem.thumbnail,
            slug: mediaItem.slug,
          },
          platform,
        },
        {
          jobId: `${mediaItem.id}-${platform}-${Date.now()}`,
        }
      );

      jobPromises.push(jobPromise);
      enabledPlatforms.push(platform);
    }

    // Wait for all jobs to be queued
    const jobs = await Promise.all(jobPromises);

    logger.info('Media item distribution queued', {
      category: 'publisher',
      mediaItemId: mediaItem.id,
      queuedCount: jobs.length,
      platforms: enabledPlatforms,
      jobIds: jobs.map((j) => j.id),
    });

    return {
      queued: jobs.length,
      platforms: enabledPlatforms,
      jobIds: jobs.map((j) => j.id),
    };
  },

  /**
   * Manually retry publishing to a specific platform
   *
   * @param {number} mediaItemId - The media item ID
   * @param {string} platform - The platform to retry
   * @returns {Promise<object>} - Job information
   */
  async retry(mediaItemId, platform) {
    logger.info('Manually retrying publish', {
      category: 'publisher',
      mediaItemId,
      platform,
    });

    // Fetch the media item
    const mediaItem = await strapi.entityService.findOne(
      'api::media-item.media-item',
      mediaItemId,
      {
        populate: ['socialThumbnail', 'thumbnail'],
      }
    );

    if (!mediaItem) {
      throw new Error(`Media item ${mediaItemId} not found`);
    }

    const { queue } = strapi.ruachPublisher || {};

    if (!queue) {
      throw new Error('Publisher queue not initialized');
    }

    // Queue the retry job
    const job = await queue.add(
      `publish-${platform}`,
      {
        mediaItem: {
          id: mediaItem.id,
          title: mediaItem.title,
          shortDescription: mediaItem.shortDescription || mediaItem.description,
          description: mediaItem.description,
          hashtags: mediaItem.hashtags,
          videoUrl: mediaItem.videoUrl,
          thumbnail: mediaItem.socialThumbnail || mediaItem.thumbnail,
          slug: mediaItem.slug,
        },
        platform,
      },
      {
        jobId: `${mediaItemId}-${platform}-retry-${Date.now()}`,
      }
    );

    logger.info('Retry job queued', {
      category: 'publisher',
      mediaItemId,
      platform,
      jobId: job.id,
    });

    return {
      jobId: job.id,
      platform,
      mediaItemId,
    };
  },

  /**
   * Get the status of all publishing jobs for a media item
   *
   * @param {number} mediaItemId - The media item ID
   * @returns {Promise<object>} - Job statuses
   */
  async getStatus(mediaItemId) {
    const { queue } = strapi.ruachPublisher || {};

    if (!queue) {
      throw new Error('Publisher queue not initialized');
    }

    // Get all jobs for this media item
    const [completed, failed, active, waiting] = await Promise.all([
      queue.getCompleted(),
      queue.getFailed(),
      queue.getActive(),
      queue.getWaiting(),
    ]);

    const allJobs = [...completed, ...failed, ...active, ...waiting];

    // Filter jobs for this media item
    const mediaItemJobs = allJobs.filter(
      (job) => job.data.mediaItem.id === mediaItemId
    );

    return {
      mediaItemId,
      totalJobs: mediaItemJobs.length,
      jobs: mediaItemJobs.map((job) => ({
        id: job.id,
        platform: job.data.platform,
        state: job.getState ? job.getState() : 'unknown',
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
      })),
    };
  },
});
