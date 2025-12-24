/**
 * R2 Direct Upload Controller
 *
 * Handles large file uploads directly to Cloudflare R2 using multipart upload.
 * Bypasses Strapi for better performance and resumability.
 */

'use strict';

const { S3Client } = require('@aws-sdk/client-s3');
const {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const logger = require('../../../config/logger');

// Initialize S3 client for R2
const getS3Client = () => {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
};

module.exports = {
  /**
   * Initiate a multipart upload
   *
   * POST /api/upload/r2-direct/initiate
   * Body: { filename: string, contentType: string, fileSize: number }
   */
  async initiate(ctx) {
    try {
      const { filename, contentType, fileSize } = ctx.request.body;

      // Validate input
      if (!filename || !contentType || !fileSize) {
        ctx.status = 400;
        ctx.body = {
          error: 'Missing required fields: filename, contentType, fileSize',
        };
        return;
      }

      // Validate file size (max 10GB for safety)
      const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB
      if (fileSize > MAX_FILE_SIZE) {
        ctx.status = 400;
        ctx.body = {
          error: `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`,
        };
        return;
      }

      // Validate content type
      const allowedVideoTypes = [
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
      ];
      if (!allowedVideoTypes.includes(contentType)) {
        ctx.status = 400;
        ctx.body = {
          error: `Content type ${contentType} not allowed for direct upload. Allowed: ${allowedVideoTypes.join(', ')}`,
        };
        return;
      }

      // Generate unique file key
      const fileHash = crypto.randomBytes(16).toString('hex');
      const fileExt = filename.substring(filename.lastIndexOf('.'));
      const key = `uploads/direct/${fileHash}${fileExt}`;

      const s3Client = getS3Client();
      const bucketName = process.env.R2_BUCKET_NAME;

      // Create multipart upload
      const createCommand = new CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
        Metadata: {
          'original-filename': filename,
          'upload-source': 'strapi-direct',
        },
      });

      const { UploadId } = await s3Client.send(createCommand);

      // Calculate number of parts (5MB per part)
      const PART_SIZE = 5 * 1024 * 1024; // 5MB
      const totalParts = Math.ceil(fileSize / PART_SIZE);

      // Store upload session in Redis (for resumption)
      await strapi.redis.setex(
        `r2-upload:${UploadId}`,
        86400, // 24 hour expiry
        JSON.stringify({
          uploadId: UploadId,
          key,
          filename,
          contentType,
          fileSize,
          totalParts,
          partSize: PART_SIZE,
          completedParts: [],
          createdAt: new Date().toISOString(),
        })
      );

      logger.info('Multipart upload initiated', {
        category: 'r2-upload',
        uploadId: UploadId,
        filename,
        fileSize,
        totalParts,
      });

      ctx.status = 200;
      ctx.body = {
        uploadId: UploadId,
        key,
        totalParts,
        partSize: PART_SIZE,
      };
    } catch (error) {
      logger.error('Failed to initiate multipart upload', {
        category: 'r2-upload',
        error: error.message,
        stack: error.stack,
      });

      ctx.status = 500;
      ctx.body = {
        error: 'Failed to initiate upload',
        message: error.message,
      };
    }
  },

  /**
   * Get presigned URL for uploading a part
   *
   * POST /api/upload/r2-direct/part-url
   * Body: { uploadId: string, partNumber: number }
   */
  async getPartUrl(ctx) {
    try {
      const { uploadId, partNumber } = ctx.request.body;

      if (!uploadId || !partNumber) {
        ctx.status = 400;
        ctx.body = {
          error: 'Missing required fields: uploadId, partNumber',
        };
        return;
      }

      // Get upload session from Redis
      const sessionData = await strapi.redis.get(`r2-upload:${uploadId}`);
      if (!sessionData) {
        ctx.status = 404;
        ctx.body = {
          error: 'Upload session not found or expired',
        };
        return;
      }

      const session = JSON.parse(sessionData);

      // Validate part number
      if (partNumber < 1 || partNumber > session.totalParts) {
        ctx.status = 400;
        ctx.body = {
          error: `Invalid part number. Must be between 1 and ${session.totalParts}`,
        };
        return;
      }

      const s3Client = getS3Client();
      const bucketName = process.env.R2_BUCKET_NAME;

      // Generate presigned URL for this part
      const uploadPartCommand = new UploadPartCommand({
        Bucket: bucketName,
        Key: session.key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      const presignedUrl = await getSignedUrl(s3Client, uploadPartCommand, {
        expiresIn: 3600, // 1 hour
      });

      ctx.status = 200;
      ctx.body = {
        uploadUrl: presignedUrl,
        partNumber,
      };
    } catch (error) {
      logger.error('Failed to generate part URL', {
        category: 'r2-upload',
        error: error.message,
      });

      ctx.status = 500;
      ctx.body = {
        error: 'Failed to generate upload URL',
        message: error.message,
      };
    }
  },

  /**
   * Mark a part as completed
   *
   * POST /api/upload/r2-direct/part-complete
   * Body: { uploadId: string, partNumber: number, etag: string }
   */
  async partComplete(ctx) {
    try {
      const { uploadId, partNumber, etag } = ctx.request.body;

      if (!uploadId || !partNumber || !etag) {
        ctx.status = 400;
        ctx.body = {
          error: 'Missing required fields: uploadId, partNumber, etag',
        };
        return;
      }

      // Get upload session
      const sessionData = await strapi.redis.get(`r2-upload:${uploadId}`);
      if (!sessionData) {
        ctx.status = 404;
        ctx.body = { error: 'Upload session not found' };
        return;
      }

      const session = JSON.parse(sessionData);

      // Add completed part
      session.completedParts.push({
        PartNumber: partNumber,
        ETag: etag,
      });

      // Update session in Redis
      await strapi.redis.setex(
        `r2-upload:${uploadId}`,
        86400,
        JSON.stringify(session)
      );

      logger.debug('Part marked as completed', {
        category: 'r2-upload',
        uploadId,
        partNumber,
        progress: `${session.completedParts.length}/${session.totalParts}`,
      });

      ctx.status = 200;
      ctx.body = {
        completedParts: session.completedParts.length,
        totalParts: session.totalParts,
        progress: (session.completedParts.length / session.totalParts) * 100,
      };
    } catch (error) {
      logger.error('Failed to mark part as completed', {
        category: 'r2-upload',
        error: error.message,
      });

      ctx.status = 500;
      ctx.body = {
        error: 'Failed to mark part as completed',
        message: error.message,
      };
    }
  },

  /**
   * Complete the multipart upload
   *
   * POST /api/upload/r2-direct/complete
   * Body: { uploadId: string }
   */
  async complete(ctx) {
    try {
      const { uploadId } = ctx.request.body;

      if (!uploadId) {
        ctx.status = 400;
        ctx.body = { error: 'Missing required field: uploadId' };
        return;
      }

      // Get upload session
      const sessionData = await strapi.redis.get(`r2-upload:${uploadId}`);
      if (!sessionData) {
        ctx.status = 404;
        ctx.body = { error: 'Upload session not found' };
        return;
      }

      const session = JSON.parse(sessionData);

      // Verify all parts are completed
      if (session.completedParts.length !== session.totalParts) {
        ctx.status = 400;
        ctx.body = {
          error: 'Not all parts uploaded',
          completedParts: session.completedParts.length,
          totalParts: session.totalParts,
        };
        return;
      }

      const s3Client = getS3Client();
      const bucketName = process.env.R2_BUCKET_NAME;

      // Sort parts by part number
      const sortedParts = session.completedParts.sort(
        (a, b) => a.PartNumber - b.PartNumber
      );

      // Complete multipart upload
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: session.key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: sortedParts,
        },
      });

      const result = await s3Client.send(completeCommand);

      // Build public URL
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${session.key.replace('uploads/', '')}`;

      // Clean up Redis session
      await strapi.redis.del(`r2-upload:${uploadId}`);

      logger.info('Multipart upload completed', {
        category: 'r2-upload',
        uploadId,
        filename: session.filename,
        fileSize: session.fileSize,
        key: session.key,
        publicUrl,
      });

      ctx.status = 200;
      ctx.body = {
        success: true,
        url: publicUrl,
        key: session.key,
        filename: session.filename,
        fileSize: session.fileSize,
        contentType: session.contentType,
      };
    } catch (error) {
      logger.error('Failed to complete multipart upload', {
        category: 'r2-upload',
        error: error.message,
        stack: error.stack,
      });

      ctx.status = 500;
      ctx.body = {
        error: 'Failed to complete upload',
        message: error.message,
      };
    }
  },

  /**
   * Abort a multipart upload
   *
   * POST /api/upload/r2-direct/abort
   * Body: { uploadId: string }
   */
  async abort(ctx) {
    try {
      const { uploadId } = ctx.request.body;

      if (!uploadId) {
        ctx.status = 400;
        ctx.body = { error: 'Missing required field: uploadId' };
        return;
      }

      // Get upload session
      const sessionData = await strapi.redis.get(`r2-upload:${uploadId}`);
      if (!sessionData) {
        ctx.status = 404;
        ctx.body = { error: 'Upload session not found' };
        return;
      }

      const session = JSON.parse(sessionData);

      const s3Client = getS3Client();
      const bucketName = process.env.R2_BUCKET_NAME;

      // Abort multipart upload
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: session.key,
        UploadId: uploadId,
      });

      await s3Client.send(abortCommand);

      // Clean up Redis session
      await strapi.redis.del(`r2-upload:${uploadId}`);

      logger.info('Multipart upload aborted', {
        category: 'r2-upload',
        uploadId,
        filename: session.filename,
      });

      ctx.status = 200;
      ctx.body = {
        success: true,
        message: 'Upload aborted successfully',
      };
    } catch (error) {
      logger.error('Failed to abort multipart upload', {
        category: 'r2-upload',
        error: error.message,
      });

      ctx.status = 500;
      ctx.body = {
        error: 'Failed to abort upload',
        message: error.message,
      };
    }
  },

  /**
   * Get upload session status (for resumption)
   *
   * GET /api/upload/r2-direct/status/:uploadId
   */
  async getStatus(ctx) {
    try {
      const { uploadId } = ctx.params;

      const sessionData = await strapi.redis.get(`r2-upload:${uploadId}`);
      if (!sessionData) {
        ctx.status = 404;
        ctx.body = { error: 'Upload session not found or expired' };
        return;
      }

      const session = JSON.parse(sessionData);

      ctx.status = 200;
      ctx.body = {
        uploadId: session.uploadId,
        filename: session.filename,
        fileSize: session.fileSize,
        totalParts: session.totalParts,
        completedParts: session.completedParts.length,
        progress: (session.completedParts.length / session.totalParts) * 100,
        completedPartNumbers: session.completedParts.map((p) => p.PartNumber),
      };
    } catch (error) {
      logger.error('Failed to get upload status', {
        category: 'r2-upload',
        error: error.message,
      });

      ctx.status = 500;
      ctx.body = {
        error: 'Failed to get upload status',
        message: error.message,
      };
    }
  },
};
