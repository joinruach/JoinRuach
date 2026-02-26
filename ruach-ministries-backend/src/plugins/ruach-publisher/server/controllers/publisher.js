/**
 * Ruach Publisher - Controller
 *
 * Handles API requests for the publisher plugin
 */

'use strict';

const crypto = require('crypto');
const logger = require('../../../../config/logger');

/**
 * Publishing Workflow State Machine — v1
 *
 * Closed set of states. Any consumer can rely on this contract.
 * Transitions: queued → processing → published
 *                                   → failed (retryable)
 *              scheduled → queued (when delay expires)
 *              failed → queued (on retry)
 *              any → cancelled (on cancel)
 */
const WORKFLOW_STATE_VERSION = 1;

const VALID_WORKFLOW_STATES = [
  'queued', 'scheduled', 'processing', 'published', 'failed', 'cancelled',
];

function toBullState(job) {
  if (job.returnvalue !== undefined && job.finishedOn) return 'completed';
  if (job.failedReason) return 'failed';
  if (job.processedOn) return 'active';
  if (job.delay && job.delay > 0) return 'delayed';
  return 'waiting';
}

const BULL_TO_WORKFLOW = {
  completed: 'published',
  failed: 'failed',
  active: 'processing',
  delayed: 'scheduled',
  waiting: 'queued',
};

const WORKFLOW_TO_PRIORITY = {
  failed: 'urgent',
  processing: 'high',
  queued: 'normal',
  scheduled: 'normal',
  published: 'low',
  cancelled: 'low',
};

function getRetryInfo(bullState) {
  if (bullState === 'failed') {
    return { retryAllowed: true, retryDeniedReason: null };
  }
  if (bullState === 'active') {
    return { retryAllowed: false, retryDeniedReason: 'in_flight_job_exists' };
  }
  if (bullState === 'waiting') {
    return { retryAllowed: false, retryDeniedReason: 'in_flight_job_exists' };
  }
  if (bullState === 'completed') {
    return { retryAllowed: false, retryDeniedReason: 'already_published' };
  }
  if (bullState === 'delayed') {
    return { retryAllowed: false, retryDeniedReason: 'scheduled_pending' };
  }
  return { retryAllowed: false, retryDeniedReason: 'not_failed' };
}

function normalizeJob(job) {
  const bullState = toBullState(job);
  const workflowState = BULL_TO_WORKFLOW[bullState] || bullState;
  const { retryAllowed, retryDeniedReason } = getRetryInfo(bullState);

  return {
    id: job.id,
    name: job.name,
    correlationId: job.data?.correlationId || null,
    platform: job.data?.platform || 'unknown',
    mediaItemId: job.data?.mediaItem?.id,
    mediaItemTitle: job.data?.mediaItem?.title,
    bullState,
    workflowState,
    workflowStateVersion: WORKFLOW_STATE_VERSION,
    priority: WORKFLOW_TO_PRIORITY[workflowState] || 'normal',
    retryAllowed,
    retryDeniedReason,
    attemptsMade: job.attemptsMade || 0,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
  };
}

module.exports = ({ strapi }) => ({
  /**
   * List publishing jobs with optional status filter and pagination
   *
   * GET /ruach-publisher/jobs?status=failed,scheduled&page=1&limit=20
   */
  async listJobs(ctx) {
    try {
      const { queue } = strapi.ruachPublisher || {};

      if (!queue) {
        return ctx.send({ success: true, jobs: [], total: 0 });
      }

      const { status, page = '1', limit = '20' } = ctx.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

      const statusFilter = status
        ? String(status).split(',').map((s) => s.trim())
        : ['completed', 'failed', 'active', 'waiting', 'delayed'];

      const stateMap = {
        completed: 'completed',
        failed: 'failed',
        active: 'active',
        processing: 'active',
        waiting: 'waiting',
        scheduled: 'delayed',
        delayed: 'delayed',
        queued: 'waiting',
        published: 'completed',
      };

      const bullStates = [...new Set(
        statusFilter.map((s) => stateMap[s] || s).filter(Boolean)
      )];

      const start = (pageNum - 1) * limitNum;
      const end = start + limitNum - 1;
      const allJobs = await queue.getJobs(bullStates, start, end);

      // Sort newest first
      allJobs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      const jobs = allJobs.map(normalizeJob);

      const counts = await queue.getJobCounts(
        'completed', 'failed', 'active', 'waiting', 'delayed'
      );

      return ctx.send({
        success: true,
        workflowStateVersion: WORKFLOW_STATE_VERSION,
        validStates: VALID_WORKFLOW_STATES,
        jobs,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        counts,
        pagination: { page: pageNum, limit: limitNum },
      });
    } catch (error) {
      logger.error('Failed to list publishing jobs', {
        category: 'publisher',
        error: error.message,
      });

      return ctx.internalServerError('Failed to list jobs', {
        error: error.message,
      });
    }
  },

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
      // Safety guard: only allow retry when no active/waiting job exists for this item+platform
      const { queue } = strapi.ruachPublisher || {};
      if (queue) {
        const [active, waiting] = await Promise.all([
          queue.getActive(),
          queue.getWaiting(),
        ]);

        const inFlight = [...active, ...waiting].find(
          (job) =>
            job.data?.mediaItem?.id === parseInt(id, 10) &&
            job.data?.platform === platform
        );

        if (inFlight) {
          return ctx.badRequest(
            `A ${platform} job is already in-flight for media item ${id}. Wait for it to complete or fail before retrying.`,
            { retryDeniedReason: 'in_flight_job_exists', existingJobId: inFlight.id }
          );
        }
      }

      const publisherService = strapi.plugin('ruach-publisher').service('publisher');
      const result = await publisherService.retry(id, platform);

      logger.info('Manual retry triggered via API', {
        category: 'publisher',
        correlationId: result.correlationId,
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
