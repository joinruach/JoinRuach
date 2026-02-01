import type { Core } from "@strapi/strapi";
import {
  enqueueTranscodingJob,
  getTranscodingJobStatus,
  listMediaTranscodingJobs,
  type TranscodingJobData,
} from "../../../services/media-transcoding-queue";

export default {
  /**
   * POST /api/media-transcode/queue
   * Queue a new transcoding job
   */
  async queueTranscodingJob(ctx: any) {
    const { strapi } = ctx;
    const {
      mediaItemId,
      sourceFileUrl,
      sourceFileName,
      mediaType,
      jobType,
      resolutions,
      thumbnailTimestamps,
      audioFormat,
    } = ctx.request.body as {
      mediaItemId: number;
      sourceFileUrl: string;
      sourceFileName: string;
      mediaType: "video" | "audio";
      jobType: "transcode" | "thumbnail" | "extract-audio";
      resolutions?: Array<{
        width: number;
        height: number;
        bitrate: string;
        label: string;
      }>;
      thumbnailTimestamps?: number[];
      audioFormat?: string;
    };

    // Validate required fields
    if (
      !mediaItemId ||
      !sourceFileUrl ||
      !sourceFileName ||
      !mediaType ||
      !jobType
    ) {
      return ctx.badRequest("Missing required fields");
    }

    // Validate media item exists
    const mediaItem = await strapi.entityService.findOne(
      "api::media-item.media-item",
      mediaItemId,
      { fields: ["id"] }
    );

    if (!mediaItem) {
      return ctx.notFound("Media item not found");
    }

    // Prepare job data
    const jobData: TranscodingJobData = {
      type: jobType,
      mediaItemId,
      sourceFileUrl,
      sourceFileName,
      mediaType,
      r2BucketName: process.env.R2_BUCKET_NAME || "ruach-media",
      r2OutputPath: `media/${mediaItemId}`,
    };

    // Add type-specific data
    if (jobType === "transcode" && resolutions) {
      jobData.resolutions = resolutions;
    } else if (jobType === "thumbnail" && thumbnailTimestamps) {
      jobData.thumbnailTimestamps = thumbnailTimestamps;
    } else if (jobType === "extract-audio" && audioFormat) {
      jobData.audioFormat = audioFormat;
    }

    try {
      const jobId = await enqueueTranscodingJob(strapi, jobData);

      if (!jobId) {
        return ctx.internalServerError("Failed to queue transcoding job");
      }

      ctx.body = {
        success: true,
        jobId,
        mediaItemId,
        jobType,
      };
    } catch (error) {
      strapi.log.error(
        "[media-transcode] Failed to queue job:",
        error instanceof Error ? error.message : error
      );
      return ctx.internalServerError("Failed to queue transcoding job");
    }
  },

  /**
   * GET /api/media-transcode/status/:jobId
   * Get the status of a transcoding job
   */
  async getJobStatus(ctx: any) {
    const { strapi } = ctx;
    const { jobId } = ctx.params as { jobId: string };

    if (!jobId) {
      return ctx.badRequest("Job ID is required");
    }

    try {
      const status = await getTranscodingJobStatus(strapi, jobId);

      if (!status) {
        return ctx.notFound("Job not found");
      }

      ctx.body = status;
    } catch (error) {
      strapi.log.error(
        "[media-transcode] Failed to get job status:",
        error instanceof Error ? error.message : error
      );
      return ctx.internalServerError("Failed to get job status");
    }
  },

  /**
   * GET /api/media-transcode/jobs/:mediaItemId
   * List all transcoding jobs for a media item
   */
  async listMediaJobs(ctx: any) {
    const { strapi } = ctx;
    const { mediaItemId } = ctx.params as { mediaItemId: string };

    if (!mediaItemId) {
      return ctx.badRequest("Media item ID is required");
    }

    const id = Number.parseInt(mediaItemId, 10);
    if (!Number.isFinite(id)) {
      return ctx.badRequest("Invalid media item ID");
    }

    // Verify media item exists
    const mediaItem = await strapi.entityService.findOne(
      "api::media-item.media-item",
      id,
      { fields: ["id"] }
    );

    if (!mediaItem) {
      return ctx.notFound("Media item not found");
    }

    try {
      const jobs = await listMediaTranscodingJobs(strapi, id);

      ctx.body = {
        mediaItemId: id,
        jobs,
      };
    } catch (error) {
      strapi.log.error(
        "[media-transcode] Failed to list jobs:",
        error instanceof Error ? error.message : error
      );
      return ctx.internalServerError("Failed to list jobs");
    }
  },

  /**
   * POST /api/media-transcode/quick-queue
   * Convenience endpoint to queue all standard transcodes for a media item
   */
  async quickQueueTranscodes(ctx: any) {
    const { strapi } = ctx;
    const { mediaItemId, sourceFileUrl, sourceFileName } = ctx.request
      .body as {
      mediaItemId: number;
      sourceFileUrl: string;
      sourceFileName: string;
    };

    if (!mediaItemId || !sourceFileUrl || !sourceFileName) {
      return ctx.badRequest("Missing required fields");
    }

    // Validate media item exists
    const mediaItem = await strapi.entityService.findOne(
      "api::media-item.media-item",
      mediaItemId,
      { fields: ["id"] }
    );

    if (!mediaItem) {
      return ctx.notFound("Media item not found");
    }

    const jobIds: string[] = [];

    try {
      // Queue 1080p, 720p, 480p transcodes
      const transcodingResolutions = [
        { width: 1920, height: 1080, bitrate: "5000k", label: "1080p" },
        { width: 1280, height: 720, bitrate: "2500k", label: "720p" },
        { width: 854, height: 480, bitrate: "1000k", label: "480p" },
      ];

      const transcodeJobId = await enqueueTranscodingJob(strapi, {
        type: "transcode",
        mediaItemId,
        sourceFileUrl,
        sourceFileName,
        mediaType: "video",
        resolutions: transcodingResolutions,
        r2BucketName: process.env.R2_BUCKET_NAME || "ruach-media",
        r2OutputPath: `media/${mediaItemId}`,
      });

      if (transcodeJobId) {
        jobIds.push(transcodeJobId);
      }

      // Queue thumbnails at 10%, 30%, 50%
      const videoDurationSec = 0; // Will be determined by FFmpeg
      const thumbnailTimestamps = [
        videoDurationSec * 0.1,
        videoDurationSec * 0.3,
        videoDurationSec * 0.5,
      ];

      const thumbnailJobId = await enqueueTranscodingJob(strapi, {
        type: "thumbnail",
        mediaItemId,
        sourceFileUrl,
        sourceFileName,
        mediaType: "video",
        thumbnailTimestamps,
        r2BucketName: process.env.R2_BUCKET_NAME || "ruach-media",
        r2OutputPath: `media/${mediaItemId}`,
      });

      if (thumbnailJobId) {
        jobIds.push(thumbnailJobId);
      }

      // Queue audio extraction
      const audioJobId = await enqueueTranscodingJob(strapi, {
        type: "extract-audio",
        mediaItemId,
        sourceFileUrl,
        sourceFileName,
        mediaType: "video",
        audioFormat: "mp3",
        r2BucketName: process.env.R2_BUCKET_NAME || "ruach-media",
        r2OutputPath: `media/${mediaItemId}`,
      });

      if (audioJobId) {
        jobIds.push(audioJobId);
      }

      ctx.body = {
        success: true,
        mediaItemId,
        jobIds,
        message: "Queued transcodes (1080p, 720p, 480p), thumbnails, and audio extraction",
      };
    } catch (error) {
      strapi.log.error(
        "[media-transcode] Failed to queue jobs:",
        error instanceof Error ? error.message : error
      );
      return ctx.internalServerError("Failed to queue transcoding jobs");
    }
  },
};
