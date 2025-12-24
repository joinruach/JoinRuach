/**
 * Upload Validation Middleware
 *
 * Validates file uploads before processing:
 * - File size limits per type
 * - MIME type whitelist
 * - Image/video dimension checks
 */

'use strict';

const logger = require('../config/logger');

// Optional: sharp for image dimension validation
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  logger.warn('Sharp not available - image dimension validation disabled', {
    category: 'upload',
  });
}

// File size limits (in bytes)
const SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB for images
  video: 2 * 1024 * 1024 * 1024, // 2GB for videos (ministry content needs headroom)
  audio: 50 * 1024 * 1024, // 50MB for audio
  document: 25 * 1024 * 1024, // 25MB for documents
  default: 10 * 1024 * 1024, // 10MB default
};

// Dimension limits
const DIMENSION_LIMITS = {
  image: {
    maxWidth: 8000,
    maxHeight: 8000,
    maxPixels: 50_000_000, // 50 megapixels
  },
  video: {
    maxWidth: 4096,
    maxHeight: 4096,
  },
};

// MIME type whitelist
const ALLOWED_MIME_TYPES = {
  // Images
  'image/jpeg': { type: 'image', extensions: ['.jpg', '.jpeg'] },
  'image/png': { type: 'image', extensions: ['.png'] },
  'image/webp': { type: 'image', extensions: ['.webp'] },
  'image/gif': { type: 'image', extensions: ['.gif'] },
  'image/svg+xml': { type: 'image', extensions: ['.svg'] },

  // Videos
  'video/mp4': { type: 'video', extensions: ['.mp4'] },
  'video/quicktime': { type: 'video', extensions: ['.mov'] },
  'video/x-msvideo': { type: 'video', extensions: ['.avi'] },
  'video/webm': { type: 'video', extensions: ['.webm'] },

  // Audio
  'audio/mpeg': { type: 'audio', extensions: ['.mp3'] },
  'audio/wav': { type: 'audio', extensions: ['.wav'] },
  'audio/ogg': { type: 'audio', extensions: ['.ogg'] },
  'audio/webm': { type: 'audio', extensions: ['.weba'] },

  // Documents
  'application/pdf': { type: 'document', extensions: ['.pdf'] },
  'application/msword': { type: 'document', extensions: ['.doc'] },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    type: 'document',
    extensions: ['.docx'],
  },
  'text/plain': { type: 'document', extensions: ['.txt'] },
  'text/markdown': { type: 'document', extensions: ['.md'] },
};

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Only validate upload endpoints
    if (!ctx.request.url.includes('/api/upload')) {
      return next();
    }

    // Only validate POST/PUT requests with files
    if (!['POST', 'PUT'].includes(ctx.request.method)) {
      return next();
    }

    // Check if request has files (multipart/form-data)
    const contentType = ctx.request.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return next();
    }

    try {
      // Wait for body parsing to complete
      await next();

      // Validate files if present
      const files = ctx.request.files?.files;
      if (!files) {
        return;
      }

      // Handle both single file and multiple files
      const fileArray = Array.isArray(files) ? files : [files];

      for (const file of fileArray) {
        await validateFile(file);
      }
    } catch (error) {
      logger.error('Upload validation failed', {
        category: 'upload',
        error: error.message,
        url: ctx.request.url,
      });

      ctx.status = 400;
      ctx.body = {
        error: {
          status: 400,
          name: 'ValidationError',
          message: error.message,
          details: {},
        },
      };
    }
  };
};

/**
 * Validate a single file
 */
async function validateFile(file) {
  const { name, size, type, filepath } = file;

  // 1. Validate MIME type
  const mimeInfo = ALLOWED_MIME_TYPES[type];
  if (!mimeInfo) {
    throw new Error(
      `File type not allowed: ${type}. Allowed types: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`
    );
  }

  // 2. Validate file extension matches MIME type
  const fileExt = name.substring(name.lastIndexOf('.')).toLowerCase();
  if (!mimeInfo.extensions.includes(fileExt)) {
    throw new Error(
      `File extension ${fileExt} does not match MIME type ${type}. Expected: ${mimeInfo.extensions.join(', ')}`
    );
  }

  // 3. Validate file size
  const fileType = mimeInfo.type;
  const sizeLimit = SIZE_LIMITS[fileType] || SIZE_LIMITS.default;

  if (size > sizeLimit) {
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    const limitMB = (sizeLimit / (1024 * 1024)).toFixed(2);
    throw new Error(
      `File size ${sizeMB}MB exceeds limit of ${limitMB}MB for ${fileType} files`
    );
  }

  // 4. Validate image dimensions (if applicable)
  if (fileType === 'image' && type !== 'image/svg+xml') {
    await validateImageDimensions(filepath, name);
  }

  logger.debug('File validated successfully', {
    category: 'upload',
    name,
    type,
    size,
    fileType,
  });
}

/**
 * Validate image dimensions
 */
async function validateImageDimensions(filepath, name) {
  // Skip if sharp not available
  if (!sharp) {
    logger.debug('Skipping image dimension validation (sharp not available)', {
      category: 'upload',
      name,
    });
    return;
  }

  try {
    const metadata = await sharp(filepath).metadata();
    const { width, height } = metadata;
    const pixels = width * height;

    if (width > DIMENSION_LIMITS.image.maxWidth) {
      throw new Error(
        `Image width ${width}px exceeds maximum of ${DIMENSION_LIMITS.image.maxWidth}px`
      );
    }

    if (height > DIMENSION_LIMITS.image.maxHeight) {
      throw new Error(
        `Image height ${height}px exceeds maximum of ${DIMENSION_LIMITS.image.maxHeight}px`
      );
    }

    if (pixels > DIMENSION_LIMITS.image.maxPixels) {
      const megapixels = (pixels / 1_000_000).toFixed(1);
      const limitMegapixels = (DIMENSION_LIMITS.image.maxPixels / 1_000_000).toFixed(1);
      throw new Error(
        `Image resolution ${megapixels}MP exceeds maximum of ${limitMegapixels}MP`
      );
    }

    logger.debug('Image dimensions validated', {
      category: 'upload',
      name,
      width,
      height,
      megapixels: (pixels / 1_000_000).toFixed(1),
    });
  } catch (error) {
    if (error.message.includes('exceeds')) {
      throw error;
    }
    // If sharp fails to read the image, it's likely corrupt
    throw new Error(`Invalid or corrupt image file: ${name}`);
  }
}
