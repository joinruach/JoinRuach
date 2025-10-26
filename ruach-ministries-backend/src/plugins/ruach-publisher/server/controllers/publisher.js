/**
 * Ruach Publisher - Controller
 *
 * Handles API requests for the publisher plugin
 */

'use strict';

const logger = require('../../../../config/logger');

module.exports = ({ strapi }) => ({
  /**
   * Manually publish a media item to all configured platforms
   *
   * POST /ruach-publisher/publish/:id
   */
  async publish(ctx) {
    const { id } = ctx.params;

    try {
      // Fetch the media item
      const mediaItem = await strapi.entityService.findOne(
        'api::media-item.media-item',
        id,
        {
          populate: ['socialThumbnail', 'thumbnail'],
        }
      );

      if (!mediaItem) {
        return ctx.notFound('Media item not found');
      }

      if (!mediaItem.autoPublish) {
        return ctx.badRequest('Auto-publish is not enabled for this media item');
      }

      // Call the publisher service
      const publisherService = strapi.plugin('ruach-publisher').service('publisher');
      const result = await publisherService.distribute(mediaItem);

      logger.info('Manual publish triggered via API', {
        category: 'publisher',
        mediaItemId: id,
        result,
      });

      return ctx.send({
        success: true,
        message: `Queued ${result.queued} publishing jobs`,
        ...result,
      });
    } catch (error) {
      logger.error('Failed to trigger manual publish', {
        category: 'publisher',
        mediaItemId: id,
        error: error.message,
      });

      return ctx.internalServerError('Failed to publish media item', {
        error: error.message,
      });
    }
  },

  /**
   * Retry publishing to a specific platform
   *
   * POST /ruach-publisher/retry/:id/:platform
   */
  async retry(ctx) {
    const { id, platform } = ctx.params;

    try {
      const publisherService = strapi.plugin('ruach-publisher').service('publisher');
      const result = await publisherService.retry(id, platform);

      logger.info('Manual retry triggered via API', {
        category: 'publisher',
        mediaItemId: id,
        platform,
        jobId: result.jobId,
      });

      return ctx.send({
        success: true,
        message: `Retry job queued for ${platform}`,
        ...result,
      });
    } catch (error) {
      logger.error('Failed to retry publish', {
        category: 'publisher',
        mediaItemId: id,
        platform,
        error: error.message,
      });

      return ctx.internalServerError('Failed to retry publish', {
        error: error.message,
      });
    }
  },

  /**
   * Get publishing status for a media item
   *
   * GET /ruach-publisher/status/:id
   */
  async getStatus(ctx) {
    const { id } = ctx.params;

    try {
      const publisherService = strapi.plugin('ruach-publisher').service('publisher');
      const status = await publisherService.getStatus(id);

      return ctx.send({
        success: true,
        ...status,
      });
    } catch (error) {
      logger.error('Failed to get publish status', {
        category: 'publisher',
        mediaItemId: id,
        error: error.message,
      });

      return ctx.internalServerError('Failed to get status', {
        error: error.message,
      });
    }
  },

  /**
   * Get list of supported platforms
   *
   * GET /ruach-publisher/platforms
   */
  async getPlatforms(ctx) {
    try {
      const providersService = strapi.plugin('ruach-publisher').service('providers');
      const platforms = providersService.getSupportedPlatforms();

      return ctx.send({
        success: true,
        platforms,
      });
    } catch (error) {
      logger.error('Failed to get platforms list', {
        category: 'publisher',
        error: error.message,
      });

      return ctx.internalServerError('Failed to get platforms', {
        error: error.message,
      });
    }
  },
});
