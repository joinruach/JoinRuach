/**
 * Presigned Upload Controller
 *
 * Handles generation of presigned URLs for direct uploads to Cloudflare R2,
 * and completion of uploads by saving file metadata to Strapi.
 */

import { factories } from '@strapi/strapi';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

type PresignedUploadRequestBody = {
  filename?: string;
  type?: string;
  size?: number;
  key?: string;
  title?: string;
  description?: string;
};

type PresignedUploadRequest = {
  request: {
    body?: PresignedUploadRequestBody;
  };
};

// Initialize R2 client
const getR2Client = () => {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured. Check R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.');
  }

  return new S3Client({
    endpoint,
    region: 'auto',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

export default factories.createCoreController('api::presigned-upload.presigned-upload', ({ strapi }) => ({
  /**
   * Generate a presigned URL for direct upload to R2
   *
   * @param {Object} ctx - Koa context
   * @param {Object} ctx.request.body
   * @param {string} ctx.request.body.filename - Original filename
   * @param {string} ctx.request.body.type - MIME type (e.g., 'video/mp4')
   * @param {number} ctx.request.body.size - File size in bytes
   *
   * @returns {Promise<Object>} Presigned URL and metadata
   */
  async generate(ctx) {
    try {
      const request = ctx.request as PresignedUploadRequest['request'];
      const requestBody = request.body ?? {};
      const { filename, type, size } = requestBody;

      // Validate required fields
      if (!filename || !type || !size) {
        return ctx.badRequest('Missing required fields: filename, type, and size are required');
      }

      // Validate file size (4GB max)
      const MAX_SIZE = 4 * 1024 * 1024 * 1024; // 4GB
      if (size > MAX_SIZE) {
        return ctx.badRequest(`File size exceeds maximum allowed size of ${MAX_SIZE / (1024 * 1024 * 1024)}GB`);
      }

      // Generate unique key for the file
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `uploads/${timestamp}-${randomString}-${sanitizedFilename}`;

      // Get R2 client
      const r2Client = getR2Client();
      const bucketName = process.env.R2_BUCKET_NAME;

      if (!bucketName) {
        throw new Error('R2_BUCKET_NAME not configured');
      }

      // Create command for presigned URL
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: type,
        // Add metadata
        Metadata: {
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Generate presigned URL (valid for 1 hour)
      const presignedUrl = await getSignedUrl(r2Client, command, {
        expiresIn: 3600, // 1 hour
      });

      // Generate public URL (for CDN)
      const cdnUrl = process.env.UPLOAD_CDN_URL || process.env.R2_ENDPOINT?.replace(/^https?:\/\/[^/]+/, '');
      const publicUrl = `${cdnUrl}/${key}`;

      // Log the upload request
      strapi.log.info(`Presigned URL generated for: ${filename} (${size} bytes)`);

      return ctx.send({
        success: true,
        data: {
          uploadUrl: presignedUrl,
          key,
          publicUrl,
          expiresIn: 3600,
        },
      });
    } catch (error) {
      strapi.log.error('Error generating presigned URL:', error);
      return ctx.internalServerError('Failed to generate presigned URL');
    }
  },

  /**
   * Complete the upload by saving file metadata to Strapi
   *
   * @param {Object} ctx - Koa context
   * @param {Object} ctx.request.body
   * @param {string} ctx.request.body.key - R2 object key
   * @param {string} ctx.request.body.filename - Original filename
   * @param {string} ctx.request.body.type - MIME type
   * @param {number} ctx.request.body.size - File size in bytes
   * @param {string} [ctx.request.body.title] - Optional title for the file
   * @param {string} [ctx.request.body.description] - Optional description
   *
   * @returns {Promise<Object>} Created file record
   */
  async complete(ctx) {
    try {
      const request = ctx.request as PresignedUploadRequest['request'];
      const requestBody = request.body ?? {};
      const { key, filename, type, size, title, description } = requestBody;

      // Validate required fields
      if (!key || !filename || !type || !size) {
        return ctx.badRequest('Missing required fields: key, filename, type, and size are required');
      }

      // Generate public URL
      const cdnUrl = process.env.UPLOAD_CDN_URL || process.env.R2_ENDPOINT?.replace(/^https?:\/\/[^/]+/, '');
      const publicUrl = `${cdnUrl}/${key}`;

      // Create file record in Strapi
      const fileRecord = await strapi.entityService.create('api::presigned-upload.presigned-upload', {
        data: {
          key,
          filename,
          mimeType: type,
          size,
          url: publicUrl,
          title: title || filename,
          description: description || null,
          uploadedAt: new Date(),
        },
      });

      strapi.log.info(`Upload completed: ${filename} (${key})`);

      return ctx.send({
        success: true,
        data: fileRecord,
      });
    } catch (error) {
      strapi.log.error('Error completing upload:', error);
      return ctx.internalServerError('Failed to complete upload');
    }
  },

  /**
   * Get upload configuration and limits
   *
   * @param {Object} ctx - Koa context
   * @returns {Promise<Object>} Upload configuration
   */
  async config(ctx) {
    const config = {
      maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB
      chunkSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      },
      maxSizeByType: {
        image: 50 * 1024 * 1024, // 50MB
        video: 4 * 1024 * 1024 * 1024, // 4GB
        audio: 500 * 1024 * 1024, // 500MB
        document: 100 * 1024 * 1024, // 100MB
      },
    };

    return ctx.send({
      success: true,
      data: config,
    });
  },

  /**
   * List uploaded files
   *
   * @param {Object} ctx - Koa context
   * @returns {Promise<Object>} List of uploaded files
   */
  async find(ctx) {
    try {
      const { query } = ctx;

      const files = await strapi.entityService.findMany('api::presigned-upload.presigned-upload', {
        ...query,
        sort: { uploadedAt: 'desc' },
      });

      return ctx.send({
        success: true,
        data: files,
      });
    } catch (error) {
      strapi.log.error('Error fetching uploads:', error);
      return ctx.internalServerError('Failed to fetch uploads');
    }
  },

  /**
   * Get a single uploaded file by ID
   *
   * @param {Object} ctx - Koa context
   * @returns {Promise<Object>} File record
   */
  async findOne(ctx) {
    try {
      const { id } = ctx.params;

      const file = await strapi.entityService.findOne('api::presigned-upload.presigned-upload', id);

      if (!file) {
        return ctx.notFound('File not found');
      }

      return ctx.send({
        success: true,
        data: file,
      });
    } catch (error) {
      strapi.log.error('Error fetching upload:', error);
      return ctx.internalServerError('Failed to fetch upload');
    }
  },

  /**
   * Delete an uploaded file
   *
   * @param {Object} ctx - Koa context
   * @returns {Promise<Object>} Success message
   */
  async delete(ctx) {
    try {
      const { id } = ctx.params;

      const file = await strapi.entityService.findOne('api::presigned-upload.presigned-upload', id);

      if (!file) {
        return ctx.notFound('File not found');
      }

      // Note: This only deletes the database record, not the actual file from R2
      // You may want to implement R2 deletion here as well
      await strapi.entityService.delete('api::presigned-upload.presigned-upload', id);

      strapi.log.info(`Upload record deleted: ${file.filename} (${file.key})`);

      return ctx.send({
        success: true,
        message: 'File record deleted successfully',
      });
    } catch (error) {
      strapi.log.error('Error deleting upload:', error);
      return ctx.internalServerError('Failed to delete upload');
    }
  },
}));
