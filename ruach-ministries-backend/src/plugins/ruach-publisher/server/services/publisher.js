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
    // Build enabled platforms list from individual boolean fields
    const platformMapping = {
      publishYouTube: 'youtube',
      publishFacebook: 'facebook',
      publishInstagram: 'instagram',
      publishX: 'x',
      publishPatreon: 'patreon',
      publishRumble: 'rumble',
      publishLocals: 'locals',
      publishTruthSocial: 'truthsocial',
    };

    const enabledPlatforms = [];
    for (const [field, platform] of Object.entries(platformMapping)) {
      if (mediaItem[field] === true) {
        enabledPlatforms.push(platform);
      }
    }

    logger.info('Distributing media item to platforms', {
      category: 'publisher',
      mediaItemId: mediaItem.id,
      mediaItemTitle: mediaItem.title,
      platforms: enabledPlatforms,
    });

    const { queue } = strapi.ruachPublisher || {};

    if (!queue) {
      throw new Error('Publisher queue not initialized. Is Redis running?');
    }

    // Validate at least one platform is enabled
    if (enabledPlatforms.length === 0) {
      logger.warn('No platforms enabled for media item', {
        category: 'publisher',
        mediaItemId: mediaItem.id,
      });
      return { queued: 0, platforms: [] };
    }

    const jobPromises = [];

    // Queue a job for each enabled platform
    for (const platform of enabledPlatforms) {
      logger.debug(`Queueing job for platform: ${platform}`, {
        category: 'publisher',
        mediaItemId: mediaItem.id,
        platform,
      });

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
    const [completed, failed, active, waiting, delayed] = await Promise.all([
      queue.getCompleted(),
      queue.getFailed(),
      queue.getActive(),
      queue.getWaiting(),
      queue.getDelayed(),
    ]);

    // Map jobs with their states
    const jobsWithStates = [
      ...completed.map((job) => ({ ...job, state: 'completed' })),
      ...failed.map((job) => ({ ...job, state: 'failed' })),
      ...active.map((job) => ({ ...job, state: 'active' })),
      ...waiting.map((job) => ({ ...job, state: 'waiting' })),
      ...delayed.map((job) => ({ ...job, state: 'delayed' })),
    ];

    // Filter jobs for this media item
    const mediaItemJobs = jobsWithStates.filter(
      (job) => job.data?.mediaItem?.id === mediaItemId
    );

    return {
      mediaItemId,
      totalJobs: mediaItemJobs.length,
      jobs: await Promise.all(
        mediaItemJobs.map(async (job) => ({
          id: job.id,
          platform: job.data.platform,
          state: job.state,
          attemptsMade: job.attemptsMade || 0,
          timestamp: job.timestamp,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
        }))
      ),
    };
  },
});
