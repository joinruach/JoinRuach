/**
 * Ruach Publisher Controller Tests
 *
 * Unit tests for the publisher plugin controller.
 * Tests pure/utility functions (toBullState, normalizeJob, getRetryInfo)
 * and controller methods via mocked BullMQ queue and strapi services.
 *
 * @version 1.0.0
 */

'use strict';

// --- Internal helpers extracted for testing ---
// The controller module does not export its pure helpers directly,
// so we re-derive them here from the source to keep tests honest.
// We also test the controller factory output by providing a mock strapi.

// ---------------------------------------------------------------------------
// 1. Re-create pure helpers (mirrors source exactly)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 2. Mock logger so requiring the controller doesn't crash
// ---------------------------------------------------------------------------

// The controller requires logger via a relative path that resolves to
// src/config/logger.js. jest.mock needs the path relative to the *module*
// being required, but since Jest resolves from the test file we use the
// absolute-ish form that Jest can find.
const path = require('path');
const loggerPath = path.resolve(
  __dirname,
  '../../src/config/logger'
);
jest.mock(loggerPath, () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// ---------------------------------------------------------------------------
// 3. Import the actual controller factory
// ---------------------------------------------------------------------------

const createController = require(
  '../../src/plugins/ruach-publisher/server/controllers/publisher'
);

// ---------------------------------------------------------------------------
// Helpers — fake BullMQ job objects
// ---------------------------------------------------------------------------

function makeJob(overrides = {}) {
  return {
    id: 'job-1',
    name: 'publish:youtube',
    data: {
      correlationId: 'corr-abc',
      platform: 'youtube',
      mediaItem: { id: 42, title: 'Sunday Service' },
    },
    attemptsMade: 0,
    timestamp: Date.now(),
    processedOn: null,
    finishedOn: null,
    failedReason: null,
    returnvalue: undefined,
    delay: 0,
    ...overrides,
  };
}

function makeCtx(overrides = {}) {
  return {
    query: {},
    params: {},
    send: jest.fn(),
    notFound: jest.fn(),
    badRequest: jest.fn(),
    internalServerError: jest.fn(),
    ...overrides,
  };
}

// ===================================================================
// TESTS
// ===================================================================

describe('Publisher Controller — Pure Helpers', () => {
  // ---------------------------------------------------------------
  // toBullState
  // ---------------------------------------------------------------
  describe('toBullState', () => {
    it('returns "completed" when returnvalue is defined and finishedOn is set', () => {
      const job = makeJob({ returnvalue: { ok: true }, finishedOn: Date.now() });
      expect(toBullState(job)).toBe('completed');
    });

    it('returns "failed" when failedReason is present', () => {
      const job = makeJob({ failedReason: 'Network error' });
      expect(toBullState(job)).toBe('failed');
    });

    it('returns "active" when processedOn is set (no failure)', () => {
      const job = makeJob({ processedOn: Date.now() });
      expect(toBullState(job)).toBe('active');
    });

    it('returns "delayed" when delay > 0 and not processed/failed/completed', () => {
      const job = makeJob({ delay: 5000 });
      expect(toBullState(job)).toBe('delayed');
    });

    it('returns "waiting" for a fresh job with no flags', () => {
      const job = makeJob();
      expect(toBullState(job)).toBe('waiting');
    });

    it('prioritises "completed" over "failed" when both flags exist', () => {
      // Edge case: a job that failed then was force-completed
      const job = makeJob({
        returnvalue: 'ok',
        finishedOn: Date.now(),
        failedReason: 'old error',
      });
      expect(toBullState(job)).toBe('completed');
    });

    it('prioritises "failed" over "active"', () => {
      const job = makeJob({
        failedReason: 'timeout',
        processedOn: Date.now(),
      });
      expect(toBullState(job)).toBe('failed');
    });
  });

  // ---------------------------------------------------------------
  // BULL_TO_WORKFLOW mapping
  // ---------------------------------------------------------------
  describe('BULL_TO_WORKFLOW', () => {
    it('maps all five BullMQ states to workflow states', () => {
      expect(BULL_TO_WORKFLOW).toEqual({
        completed: 'published',
        failed: 'failed',
        active: 'processing',
        delayed: 'scheduled',
        waiting: 'queued',
      });
    });

    it('every mapped workflow state is in VALID_WORKFLOW_STATES', () => {
      Object.values(BULL_TO_WORKFLOW).forEach((ws) => {
        expect(VALID_WORKFLOW_STATES).toContain(ws);
      });
    });
  });

  // ---------------------------------------------------------------
  // VALID_WORKFLOW_STATES
  // ---------------------------------------------------------------
  describe('VALID_WORKFLOW_STATES', () => {
    it('contains exactly six states', () => {
      expect(VALID_WORKFLOW_STATES).toHaveLength(6);
    });

    it('includes cancelled (not mapped from Bull but valid)', () => {
      expect(VALID_WORKFLOW_STATES).toContain('cancelled');
    });
  });

  // ---------------------------------------------------------------
  // WORKFLOW_TO_PRIORITY
  // ---------------------------------------------------------------
  describe('WORKFLOW_TO_PRIORITY', () => {
    it('assigns "urgent" to failed', () => {
      expect(WORKFLOW_TO_PRIORITY.failed).toBe('urgent');
    });

    it('assigns "high" to processing', () => {
      expect(WORKFLOW_TO_PRIORITY.processing).toBe('high');
    });

    it('assigns "normal" to queued and scheduled', () => {
      expect(WORKFLOW_TO_PRIORITY.queued).toBe('normal');
      expect(WORKFLOW_TO_PRIORITY.scheduled).toBe('normal');
    });

    it('assigns "low" to published and cancelled', () => {
      expect(WORKFLOW_TO_PRIORITY.published).toBe('low');
      expect(WORKFLOW_TO_PRIORITY.cancelled).toBe('low');
    });
  });

  // ---------------------------------------------------------------
  // getRetryInfo
  // ---------------------------------------------------------------
  describe('getRetryInfo', () => {
    it('allows retry for failed jobs', () => {
      const info = getRetryInfo('failed');
      expect(info).toEqual({ retryAllowed: true, retryDeniedReason: null });
    });

    it('denies retry for active jobs with in_flight reason', () => {
      const info = getRetryInfo('active');
      expect(info).toEqual({
        retryAllowed: false,
        retryDeniedReason: 'in_flight_job_exists',
      });
    });

    it('denies retry for waiting jobs with in_flight reason', () => {
      const info = getRetryInfo('waiting');
      expect(info).toEqual({
        retryAllowed: false,
        retryDeniedReason: 'in_flight_job_exists',
      });
    });

    it('denies retry for completed jobs with already_published reason', () => {
      const info = getRetryInfo('completed');
      expect(info).toEqual({
        retryAllowed: false,
        retryDeniedReason: 'already_published',
      });
    });

    it('denies retry for delayed jobs with scheduled_pending reason', () => {
      const info = getRetryInfo('delayed');
      expect(info).toEqual({
        retryAllowed: false,
        retryDeniedReason: 'scheduled_pending',
      });
    });

    it('denies retry for unknown states with generic reason', () => {
      const info = getRetryInfo('some_weird_state');
      expect(info).toEqual({
        retryAllowed: false,
        retryDeniedReason: 'not_failed',
      });
    });
  });

  // ---------------------------------------------------------------
  // normalizeJob
  // ---------------------------------------------------------------
  describe('normalizeJob', () => {
    it('normalizes a waiting job correctly', () => {
      const job = makeJob();
      const result = normalizeJob(job);

      expect(result.bullState).toBe('waiting');
      expect(result.workflowState).toBe('queued');
      expect(result.priority).toBe('normal');
      expect(result.retryAllowed).toBe(false);
      expect(result.retryDeniedReason).toBe('in_flight_job_exists');
      expect(result.workflowStateVersion).toBe(1);
      expect(result.correlationId).toBe('corr-abc');
      expect(result.platform).toBe('youtube');
      expect(result.mediaItemId).toBe(42);
      expect(result.mediaItemTitle).toBe('Sunday Service');
    });

    it('normalizes a failed job correctly', () => {
      const job = makeJob({ failedReason: 'API rate limit', attemptsMade: 3 });
      const result = normalizeJob(job);

      expect(result.bullState).toBe('failed');
      expect(result.workflowState).toBe('failed');
      expect(result.priority).toBe('urgent');
      expect(result.retryAllowed).toBe(true);
      expect(result.retryDeniedReason).toBeNull();
      expect(result.attemptsMade).toBe(3);
      expect(result.failedReason).toBe('API rate limit');
    });

    it('normalizes a completed/published job correctly', () => {
      const now = Date.now();
      const job = makeJob({ returnvalue: { url: 'https://yt.be/x' }, finishedOn: now });
      const result = normalizeJob(job);

      expect(result.bullState).toBe('completed');
      expect(result.workflowState).toBe('published');
      expect(result.priority).toBe('low');
      expect(result.retryAllowed).toBe(false);
      expect(result.finishedOn).toBe(now);
    });

    it('normalizes an active/processing job correctly', () => {
      const now = Date.now();
      const job = makeJob({ processedOn: now });
      const result = normalizeJob(job);

      expect(result.bullState).toBe('active');
      expect(result.workflowState).toBe('processing');
      expect(result.priority).toBe('high');
      expect(result.retryAllowed).toBe(false);
    });

    it('normalizes a delayed/scheduled job correctly', () => {
      const job = makeJob({ delay: 60000 });
      const result = normalizeJob(job);

      expect(result.bullState).toBe('delayed');
      expect(result.workflowState).toBe('scheduled');
      expect(result.priority).toBe('normal');
      expect(result.retryAllowed).toBe(false);
      expect(result.retryDeniedReason).toBe('scheduled_pending');
    });

    it('defaults platform to "unknown" when missing', () => {
      const job = makeJob({ data: {} });
      const result = normalizeJob(job);
      expect(result.platform).toBe('unknown');
    });

    it('defaults correlationId to null when missing', () => {
      const job = makeJob({ data: { platform: 'youtube' } });
      const result = normalizeJob(job);
      expect(result.correlationId).toBeNull();
    });

    it('defaults attemptsMade to 0 when missing', () => {
      const job = makeJob();
      delete job.attemptsMade;
      const result = normalizeJob(job);
      expect(result.attemptsMade).toBe(0);
    });
  });
});

// ===================================================================
// Controller methods (mocked strapi + queue)
// ===================================================================

describe('Publisher Controller — Controller Methods', () => {
  let controller;
  let mockQueue;
  let mockStrapi;
  let mockPublisherService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQueue = {
      getJobs: jest.fn().mockResolvedValue([]),
      getJob: jest.fn().mockResolvedValue(null),
      getActive: jest.fn().mockResolvedValue([]),
      getWaiting: jest.fn().mockResolvedValue([]),
      getJobCounts: jest.fn().mockResolvedValue({
        completed: 0, failed: 0, active: 0, waiting: 0, delayed: 0,
      }),
      add: jest.fn().mockResolvedValue({ id: 'new-job-1' }),
    };

    mockPublisherService = {
      distribute: jest.fn().mockResolvedValue({ queued: 2 }),
      retry: jest.fn().mockResolvedValue({ jobId: 'retry-1', correlationId: 'corr-retry' }),
      getStatus: jest.fn().mockResolvedValue({ status: 'published' }),
    };

    mockStrapi = {
      ruachPublisher: { queue: mockQueue },
      entityService: {
        findOne: jest.fn(),
      },
      plugin: jest.fn().mockReturnValue({
        service: jest.fn().mockReturnValue(mockPublisherService),
      }),
    };

    controller = createController({ strapi: mockStrapi });
  });

  // ---------------------------------------------------------------
  // listJobs
  // ---------------------------------------------------------------
  describe('listJobs', () => {
    it('returns empty jobs array when queue has no jobs', async () => {
      const ctx = makeCtx({ query: {} });
      await controller.listJobs(ctx);

      expect(ctx.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          jobs: [],
          validStates: VALID_WORKFLOW_STATES,
          workflowStateVersion: 1,
        })
      );
    });

    it('returns normalized jobs with workflowState and priority', async () => {
      const now = Date.now();
      const jobs = [
        makeJob({ id: '1', failedReason: 'timeout', timestamp: now - 1000 }),
        makeJob({ id: '2', timestamp: now }),
      ];
      mockQueue.getJobs.mockResolvedValue(jobs);

      const ctx = makeCtx({ query: {} });
      await controller.listJobs(ctx);

      const sent = ctx.send.mock.calls[0][0];
      expect(sent.jobs).toHaveLength(2);

      // Newest first (job 2 has higher timestamp)
      expect(sent.jobs[0].id).toBe('2');
      expect(sent.jobs[0].workflowState).toBe('queued');
      expect(sent.jobs[0].priority).toBe('normal');

      expect(sent.jobs[1].id).toBe('1');
      expect(sent.jobs[1].workflowState).toBe('failed');
      expect(sent.jobs[1].priority).toBe('urgent');
    });

    it('paginates correctly with page and limit', async () => {
      const ctx = makeCtx({ query: { page: '2', limit: '10' } });
      await controller.listJobs(ctx);

      // start = (2-1)*10 = 10, end = 19
      expect(mockQueue.getJobs).toHaveBeenCalledWith(
        expect.any(Array),
        10,
        19
      );

      const sent = ctx.send.mock.calls[0][0];
      expect(sent.pagination).toEqual({ page: 2, limit: 10 });
    });

    it('clamps limit to max 100', async () => {
      const ctx = makeCtx({ query: { page: '1', limit: '500' } });
      await controller.listJobs(ctx);

      expect(mockQueue.getJobs).toHaveBeenCalledWith(
        expect.any(Array),
        0,
        99 // (1-1)*100 to 99
      );

      const sent = ctx.send.mock.calls[0][0];
      expect(sent.pagination.limit).toBe(100);
    });

    it('clamps page to minimum 1', async () => {
      const ctx = makeCtx({ query: { page: '-5', limit: '20' } });
      await controller.listJobs(ctx);

      expect(mockQueue.getJobs).toHaveBeenCalledWith(
        expect.any(Array),
        0,
        19
      );
    });

    it('filters by status when provided', async () => {
      const ctx = makeCtx({ query: { status: 'failed,scheduled' } });
      await controller.listJobs(ctx);

      // failed -> 'failed', scheduled -> 'delayed'
      const bullStates = mockQueue.getJobs.mock.calls[0][0];
      expect(bullStates).toContain('failed');
      expect(bullStates).toContain('delayed');
      expect(bullStates).not.toContain('completed');
    });

    it('maps workflow status names to BullMQ states', async () => {
      const ctx = makeCtx({ query: { status: 'published,processing,queued' } });
      await controller.listJobs(ctx);

      const bullStates = mockQueue.getJobs.mock.calls[0][0];
      expect(bullStates).toContain('completed');  // published -> completed
      expect(bullStates).toContain('active');      // processing -> active
      expect(bullStates).toContain('waiting');     // queued -> waiting
    });

    it('returns empty jobs when queue is not available', async () => {
      mockStrapi.ruachPublisher = undefined;
      controller = createController({ strapi: mockStrapi });

      const ctx = makeCtx({ query: {} });
      await controller.listJobs(ctx);

      expect(ctx.send).toHaveBeenCalledWith({
        success: true, jobs: [], total: 0,
      });
    });

    it('calls internalServerError when queue.getJobs throws', async () => {
      mockQueue.getJobs.mockRejectedValue(new Error('Redis down'));
      const ctx = makeCtx({ query: {} });

      await controller.listJobs(ctx);

      expect(ctx.internalServerError).toHaveBeenCalledWith(
        'Failed to list jobs',
        expect.objectContaining({ error: 'Redis down' })
      );
    });
  });

  // ---------------------------------------------------------------
  // retry — in-flight guard
  // ---------------------------------------------------------------
  describe('retry', () => {
    it('rejects retry when an active job exists for the same item+platform', async () => {
      const activeJob = makeJob({
        id: 'active-1',
        data: { platform: 'youtube', mediaItem: { id: 42 } },
        processedOn: Date.now(),
      });
      mockQueue.getActive.mockResolvedValue([activeJob]);

      const ctx = makeCtx({ params: { id: '42', platform: 'youtube' } });
      await controller.retry(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith(
        expect.stringContaining('already in-flight'),
        expect.objectContaining({
          retryDeniedReason: 'in_flight_job_exists',
          existingJobId: 'active-1',
        })
      );
      expect(mockPublisherService.retry).not.toHaveBeenCalled();
    });

    it('rejects retry when a waiting job exists for the same item+platform', async () => {
      const waitingJob = makeJob({
        id: 'wait-1',
        data: { platform: 'youtube', mediaItem: { id: 42 } },
      });
      mockQueue.getWaiting.mockResolvedValue([waitingJob]);

      const ctx = makeCtx({ params: { id: '42', platform: 'youtube' } });
      await controller.retry(ctx);

      expect(ctx.badRequest).toHaveBeenCalled();
      expect(mockPublisherService.retry).not.toHaveBeenCalled();
    });

    it('allows retry when no in-flight job matches', async () => {
      // Active job is for a different platform
      const activeJob = makeJob({
        id: 'active-other',
        data: { platform: 'facebook', mediaItem: { id: 42 } },
        processedOn: Date.now(),
      });
      mockQueue.getActive.mockResolvedValue([activeJob]);
      mockQueue.getWaiting.mockResolvedValue([]);

      const ctx = makeCtx({ params: { id: '42', platform: 'youtube' } });
      await controller.retry(ctx);

      expect(ctx.badRequest).not.toHaveBeenCalled();
      expect(mockPublisherService.retry).toHaveBeenCalledWith('42', 'youtube');
      expect(ctx.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('allows retry when queue is not available (no guard)', async () => {
      mockStrapi.ruachPublisher = undefined;
      controller = createController({ strapi: mockStrapi });

      const ctx = makeCtx({ params: { id: '42', platform: 'youtube' } });
      await controller.retry(ctx);

      expect(mockPublisherService.retry).toHaveBeenCalledWith('42', 'youtube');
      expect(ctx.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('calls internalServerError when service.retry throws', async () => {
      mockPublisherService.retry.mockRejectedValue(new Error('DB error'));
      const ctx = makeCtx({ params: { id: '42', platform: 'youtube' } });

      await controller.retry(ctx);

      expect(ctx.internalServerError).toHaveBeenCalledWith(
        'Failed to retry publish',
        expect.objectContaining({ error: 'DB error' })
      );
    });
  });

  // ---------------------------------------------------------------
  // getStatus
  // ---------------------------------------------------------------
  describe('getStatus', () => {
    it('returns status from the publisher service', async () => {
      mockPublisherService.getStatus.mockResolvedValue({
        youtube: 'published',
        facebook: 'failed',
      });

      const ctx = makeCtx({ params: { id: '42' } });
      await controller.getStatus(ctx);

      expect(mockPublisherService.getStatus).toHaveBeenCalledWith('42');
      expect(ctx.send).toHaveBeenCalledWith({
        success: true,
        youtube: 'published',
        facebook: 'failed',
      });
    });

    it('calls internalServerError when service.getStatus throws', async () => {
      mockPublisherService.getStatus.mockRejectedValue(new Error('Not found'));
      const ctx = makeCtx({ params: { id: '42' } });

      await controller.getStatus(ctx);

      expect(ctx.internalServerError).toHaveBeenCalledWith(
        'Failed to get status',
        expect.objectContaining({ error: 'Not found' })
      );
    });
  });

  // ---------------------------------------------------------------
  // publish
  // ---------------------------------------------------------------
  describe('publish', () => {
    it('returns notFound when media item does not exist', async () => {
      mockStrapi.entityService.findOne.mockResolvedValue(null);
      const ctx = makeCtx({ params: { id: '99' } });

      await controller.publish(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('Media item not found');
    });

    it('returns badRequest when autoPublish is disabled', async () => {
      mockStrapi.entityService.findOne.mockResolvedValue({
        id: 42,
        autoPublish: false,
      });
      const ctx = makeCtx({ params: { id: '42' } });

      await controller.publish(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith(
        'Auto-publish is not enabled for this media item'
      );
    });

    it('queues publish jobs when media item is valid', async () => {
      mockStrapi.entityService.findOne.mockResolvedValue({
        id: 42,
        autoPublish: true,
      });

      const ctx = makeCtx({ params: { id: '42' } });
      await controller.publish(ctx);

      expect(mockPublisherService.distribute).toHaveBeenCalled();
      expect(ctx.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Queued 2 publishing jobs',
          queued: 2,
        })
      );
    });
  });
});
