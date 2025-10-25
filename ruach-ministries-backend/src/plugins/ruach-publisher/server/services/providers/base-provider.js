/**
 * Base Provider Class
 *
 * Abstract class that all platform providers extend
 */

'use strict';

const logger = require('../../../../../config/logger');

class BaseProvider {
  constructor(strapi, platformName) {
    this.strapi = strapi;
    this.platformName = platformName;
  }

  /**
   * Publish media item to platform
   * Must be implemented by each provider
   *
   * @param {object} mediaItem - The media item to publish
   * @returns {Promise<object>} - Result with platform-specific data
   */
  async publish(mediaItem) {
    throw new Error(`publish() method not implemented for ${this.platformName}`);
  }

  /**
   * Validate that required credentials are configured
   *
   * @param {Array<string>} requiredEnvVars - Required environment variables
   * @throws {Error} - If credentials are missing
   */
  validateCredentials(requiredEnvVars) {
    const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missing.length > 0) {
      throw new Error(
        `Missing ${this.platformName} credentials: ${missing.join(', ')}`
      );
    }
  }

  /**
   * Format caption with hashtags
   *
   * @param {string} shortDescription - The description
   * @param {string} hashtags - Space-separated hashtags
   * @param {string} url - Optional URL to append
   * @returns {string} - Formatted caption
   */
  formatCaption(shortDescription, hashtags, url) {
    let caption = shortDescription || '';

    if (hashtags) {
      caption += `\n\n${hashtags}`;
    }

    if (url) {
      caption += `\n\n🔗 ${url}`;
    }

    return caption.trim();
  }

  /**
   * Get the public URL for a media item
   *
   * @param {string} slug - The media item slug
   * @returns {string} - Public URL
   */
  getPublicUrl(slug) {
    const baseUrl = process.env.PUBLIC_URL || 'https://joinruach.org';
    return `${baseUrl}/watch/${slug}`;
  }

  /**
   * Download thumbnail from URL
   *
   * @param {object} thumbnail - Strapi media object
   * @returns {Promise<Buffer>} - Thumbnail buffer
   */
  async downloadThumbnail(thumbnail) {
    if (!thumbnail || !thumbnail.url) {
      return null;
    }

    try {
      const fetch = (await import('node-fetch')).default;
      const thumbnailUrl = thumbnail.url.startsWith('http')
        ? thumbnail.url
        : `${process.env.API_URL || 'http://localhost:1337'}${thumbnail.url}`;

      const response = await fetch(thumbnailUrl);
      if (!response.ok) {
        throw new Error(`Failed to download thumbnail: ${response.statusText}`);
      }

      return await response.buffer();
    } catch (error) {
      logger.error('Failed to download thumbnail', {
        category: 'publisher',
        platform: this.platformName,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Log publishing attempt
   */
  logPublish(mediaItem, action, data = {}) {
    logger.info(`${this.platformName}: ${action}`, {
      category: 'publisher',
      platform: this.platformName,
      mediaItemId: mediaItem.id,
      mediaItemTitle: mediaItem.title,
      ...data,
    });
  }

  /**
   * Log publishing error
   */
  logError(mediaItem, error, context = {}) {
    logger.error(`${this.platformName}: Publishing failed`, {
      category: 'publisher',
      platform: this.platformName,
      mediaItemId: mediaItem.id,
      mediaItemTitle: mediaItem.title,
      error: error.message,
      stack: error.stack,
      ...context,
    });
  }
}

module.exports = BaseProvider;
