import type { Core } from '@strapi/strapi';
import { randomUUID } from 'crypto';
import RenderStateMachine, { type RenderStatus } from '../../../services/render-state-machine';

/**
 * Phase 13: Render Job Service
 *
 * Orchestrates render job lifecycle and state transitions
 * Works with existing schema: jobId, recordingSession, edl, format, status, etc.
 */

export type RenderFormat = 'full_16_9' | 'short_9_16' | 'clip_1_1' | 'thumbnail';

export interface CreateRenderJobInput {
  sessionId: string;
  format?: RenderFormat;
  metadata?: Record<string, any>;
}

export interface RenderArtifacts {
  outputVideoUrl: string;
  outputThumbnailUrl?: string;
  outputChaptersUrl?: string;
  outputSubtitlesUrl?: string;
  durationMs?: number;
  fileSizeBytes?: number;
  resolution?: string;
  fps?: number;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Create a new render job
   *
   * @param input - Job creation parameters
   * @returns Created render job
   */
  async createJob(input: CreateRenderJobInput) {
    const { sessionId, format = 'full_16_9', metadata = {} } = input;

    strapi.log.info(`[render-job-service] Creating job for session ${sessionId}, format ${format}`);

    // Load session with assets and EDL
    const session = await strapi.entityService.findOne(
      'api::recording-session.recording-session',
      sessionId,
      {
        populate: ['assets'] as any,
      }
    ) as any;

    // Fetch EDL separately
    const edls = await strapi.entityService.findMany('api::edit-decision-list.edit-decision-list', {
      filters: { session: sessionId },
      limit: 1,
    }) as any[];

    const edl = edls && edls.length > 0 ? edls[0] : null;
    session.edl = edl;

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Validate EDL exists
    if (!session.edl) {
      throw new Error(`Session ${sessionId} has no EDL. Generate and lock EDL first.`);
    }

    // Validate EDL is locked
    if (session.edl.status !== 'locked') {
      throw new Error(
        `EDL must be locked before rendering. Current status: ${session.edl.status}`
      );
    }

    // Validate assets exist
    if (!session.assets || session.assets.length === 0) {
      throw new Error(`Session ${sessionId} has no assets for rendering`);
    }

    // Generate unique job ID
    const jobId = `render-${Date.now()}-${randomUUID().slice(0, 8)}`;

    // Create render job
    const job = await strapi.entityService.create('api::render-job.render-job', {
      data: {
        jobId,
        recordingSession: sessionId,
        edl: session.edl.id,
        format,
        status: 'queued',
        progress: 0,
        duration_ms: null,
        fileSize_bytes: null,
        resolution: null,
        fps: null,
        metadata: {
          ...metadata,
          createdBy: 'operator',
          remotionVersion: '4.0.415',
        },
      } as any,
    }) as any;

    strapi.log.info(`[render-job-service] Created job ${jobId} for session ${sessionId}`);

    return job;
  },

  /**
   * Transition job to new status
   *
   * @param jobId - Unique job identifier
   * @param newStatus - Target status
   * @param metadata - Optional metadata to update
   * @returns Updated render job
   */
  async transitionStatus(
    jobId: string,
    newStatus: RenderStatus,
    metadata?: {
      progress?: number;
      errorMessage?: string;
      bullmqJobId?: string;
    }
  ) {
    // Find job
    const jobs = await strapi.entityService.findMany('api::render-job.render-job', {
      filters: { jobId },
      limit: 1,
    }) as any[];

    if (!jobs || jobs.length === 0) {
      throw new Error(`Render job ${jobId} not found`);
    }

    const job = jobs[0];
    const currentStatus = job.status as RenderStatus;

    // Validate transition
    const transition = RenderStateMachine.canTransition(currentStatus, newStatus);
    if (!transition.allowed) {
      throw new Error(transition.reason || 'Invalid state transition');
    }

    // Build update data
    const updateData: any = {
      status: newStatus,
    };

    if (metadata?.progress !== undefined) {
      updateData.progress = metadata.progress;
    }

    if (metadata?.errorMessage) {
      updateData.errorMessage = metadata.errorMessage;
    }

    if (metadata?.bullmqJobId) {
      updateData.bullmq_job_id = metadata.bullmqJobId;
    }

    // Track render timing
    if (newStatus === 'processing' && !job.renderStartedAt) {
      updateData.renderStartedAt = new Date();
    }

    if (newStatus === 'completed' || newStatus === 'failed') {
      updateData.renderCompletedAt = new Date();
    }

    // Update job
    const updated = await strapi.entityService.update(
      'api::render-job.render-job',
      job.id,
      {
        data: updateData,
      }
    ) as any;

    strapi.log.info(
      `[render-job-service] Job ${jobId} transitioned: ${currentStatus} → ${newStatus}`
    );

    return updated;
  },

  /**
   * Mark job as completed with artifacts
   *
   * @param jobId - Unique job identifier
   * @param artifacts - Render output artifacts
   * @returns Updated render job
   */
  async completeJob(jobId: string, artifacts: RenderArtifacts) {
    strapi.log.info(`[render-job-service] Completing job ${jobId} with artifacts`);

    const jobs = await strapi.entityService.findMany('api::render-job.render-job', {
      filters: { jobId },
      limit: 1,
    }) as any[];

    if (!jobs || jobs.length === 0) {
      throw new Error(`Render job ${jobId} not found`);
    }

    const job = jobs[0];

    // Validate transition to completed
    const transition = RenderStateMachine.canTransition(job.status, 'completed');
    if (!transition.allowed) {
      throw new Error(`Cannot complete job in status: ${job.status}`);
    }

    // Update with artifacts
    const updated = await strapi.entityService.update(
      'api::render-job.render-job',
      job.id,
      {
        data: {
          status: 'completed',
          progress: 1.0,
          output_r2_url: artifacts.outputVideoUrl,
          output_thumbnail_url: artifacts.outputThumbnailUrl,
          output_chapters_url: artifacts.outputChaptersUrl,
          output_subtitles_url: artifacts.outputSubtitlesUrl,
          duration_ms: artifacts.durationMs,
          fileSize_bytes: artifacts.fileSizeBytes,
          resolution: artifacts.resolution,
          fps: artifacts.fps,
          renderCompletedAt: new Date(),
        },
      }
    ) as any;

    strapi.log.info(`[render-job-service] Job ${jobId} completed successfully`);

    return updated;
  },

  /**
   * Mark job as failed
   *
   * @param jobId - Unique job identifier
   * @param errorMessage - Error description
   * @returns Updated render job
   */
  async failJob(jobId: string, errorMessage: string) {
    strapi.log.error(`[render-job-service] Job ${jobId} failed: ${errorMessage}`);

    const jobs = await strapi.entityService.findMany('api::render-job.render-job', {
      filters: { jobId },
      limit: 1,
    }) as any[];

    if (!jobs || jobs.length === 0) {
      throw new Error(`Render job ${jobId} not found`);
    }

    const job = jobs[0];

    // Validate transition to failed
    const transition = RenderStateMachine.canTransition(job.status, 'failed');
    if (!transition.allowed) {
      throw new Error(`Cannot fail job in status: ${job.status}`);
    }

    // Update with error
    const updated = await strapi.entityService.update(
      'api::render-job.render-job',
      job.id,
      {
        data: {
          status: 'failed',
          errorMessage,
          renderCompletedAt: new Date(),
        },
      }
    ) as any;

    return updated;
  },

  /**
   * Retry a failed job
   *
   * @param jobId - Unique job identifier
   * @returns Updated render job
   */
  async retryJob(jobId: string) {
    strapi.log.info(`[render-job-service] Retrying job ${jobId}`);

    const jobs = await strapi.entityService.findMany('api::render-job.render-job', {
      filters: { jobId },
      limit: 1,
    }) as any[];

    if (!jobs || jobs.length === 0) {
      throw new Error(`Render job ${jobId} not found`);
    }

    const job = jobs[0];

    // Validate retry is allowed
    if (!RenderStateMachine.canRetry(job.status)) {
      throw new Error(`Cannot retry job in status: ${job.status}`);
    }

    // Reset to queued
    const updated = await strapi.entityService.update(
      'api::render-job.render-job',
      job.id,
      {
        data: {
          status: 'queued',
          progress: 0,
          errorMessage: null,
          renderStartedAt: null,
          renderCompletedAt: null,
        },
      }
    ) as any;

    strapi.log.info(`[render-job-service] Job ${jobId} queued for retry`);

    return updated;
  },

  /**
   * Cancel an active job
   *
   * @param jobId - Unique job identifier
   * @returns Updated render job
   */
  async cancelJob(jobId: string) {
    strapi.log.info(`[render-job-service] Cancelling job ${jobId}`);

    const jobs = await strapi.entityService.findMany('api::render-job.render-job', {
      filters: { jobId },
      limit: 1,
    }) as any[];

    if (!jobs || jobs.length === 0) {
      throw new Error(`Render job ${jobId} not found`);
    }

    const job = jobs[0];

    // Can only cancel active jobs
    if (!RenderStateMachine.isActive(job.status)) {
      throw new Error(`Cannot cancel job in status: ${job.status}`);
    }

    const updated = await strapi.entityService.update(
      'api::render-job.render-job',
      job.id,
      {
        data: {
          status: 'cancelled',
          renderCompletedAt: new Date(),
        },
      }
    ) as any;

    strapi.log.info(`[render-job-service] Job ${jobId} cancelled`);

    return updated;
  },

  /**
   * Get job by ID
   *
   * @param jobId - Unique job identifier
   * @returns Render job with relations
   */
  async getJob(jobId: string) {
    const jobs = await strapi.entityService.findMany('api::render-job.render-job', {
      filters: { jobId },
      populate: ['recordingSession', 'edl'],
      limit: 1,
    }) as any[];

    if (!jobs || jobs.length === 0) {
      throw new Error(`Render job ${jobId} not found`);
    }

    return jobs[0];
  },

  /**
   * Get all jobs for a session
   *
   * @param sessionId - Recording session ID
   * @returns Array of render jobs
   */
  async getJobsForSession(sessionId: string) {
    const jobs = await strapi.entityService.findMany('api::render-job.render-job', {
      filters: {
        recordingSession: {
          id: sessionId,
        },
      },
      populate: ['recordingSession', 'edl'],
      sort: 'createdAt:desc',
    }) as any[];

    return jobs;
  },
});
