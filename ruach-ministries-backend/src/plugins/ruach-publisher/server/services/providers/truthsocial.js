/**
 * Truth Social Provider
 *
 * Posts to Truth Social using the Mastodon-compatible API
 * Requires OAuth2 authentication
 */

'use strict';

const BaseProvider = require('./base-provider');

class TruthSocialProvider extends BaseProvider {
  constructor(strapi) {
    super(strapi, 'Truth Social');

    this.validateCredentials(['TRUTH_SOCIAL_ACCESS_TOKEN']);

    this.accessToken = process.env.TRUTH_SOCIAL_ACCESS_TOKEN;
    this.apiUrl = 'https://truthsocial.com/api/v1';
  }

  /**
   * Publish post to Truth Social
   *
   * @param {object} mediaItem - The media item to publish
   * @returns {Promise<object>} - Post details
   */
  async publish(mediaItem) {
    this.logPublish(mediaItem, 'Publishing to Truth Social');

    try {
      const publicUrl = this.getPublicUrl(mediaItem.slug);

      // Truth Social has a 500 character limit
      let status = mediaItem.shortDescription || mediaItem.title;

      // Add hashtags if there's space
      if (mediaItem.hashtags) {
        const hashtagText = `\n\n${mediaItem.hashtags}`;
        if ((status + hashtagText + publicUrl.length + 3) <= 500) {
          status += hashtagText;
        }
      }

      // Add URL
      status += `\n\n${publicUrl}`;

      let result;

      // If thumbnail is available, post with media
      if (mediaItem.thumbnail) {
        this.logPublish(mediaItem, 'Downloading thumbnail for Truth Social');
        const mediaBuffer = await this.downloadThumbnail(mediaItem.thumbnail);

        if (mediaBuffer) {
          this.logPublish(mediaItem, 'Posting to Truth Social with media');
          result = await this.postWithMedia(status, mediaBuffer, mediaItem);
        } else {
          this.logPublish(mediaItem, 'Failed to download thumbnail, posting without media');
          result = await this.postStatus(status, mediaItem);
        }
      } else {
        // Post text-only status
        result = await this.postStatus(status, mediaItem);
      }

      this.logPublish(mediaItem, 'Successfully published to Truth Social', {
        statusId: result.id,
        withMedia: result.type === 'status_with_media',
      });

      return result;
    } catch (error) {
      this.logError(mediaItem, error);
      throw error;
    }
  }

  /**
   * Post a status (toot) to Truth Social
   */
  async postStatus(status, mediaItem) {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`${this.apiUrl}/statuses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        visibility: 'public',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Truth Social API error: ${error.error || response.statusText}`);
    }

    const data = await response.json();

    return {
      type: 'status',
      id: data.id,
      text: data.content,
      url: data.url || `https://truthsocial.com/@username/statuses/${data.id}`,
      createdAt: data.created_at,
    };
  }

  /**
   * Post a status with media attachment
   */
  async postWithMedia(status, mediaBuffer, mediaItem) {
    const fetch = (await import('node-fetch')).default;
    const FormData = (await import('form-data')).default;

    // Step 1: Upload media
    const mediaFormData = new FormData();
    mediaFormData.append('file', mediaBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg',
    });

    const mediaResponse = await fetch(`${this.apiUrl}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: mediaFormData,
    });

    if (!mediaResponse.ok) {
      const error = await mediaResponse.json();
      throw new Error(`Truth Social media upload error: ${error.error || mediaResponse.statusText}`);
    }

    const mediaData = await mediaResponse.json();

    // Step 2: Post status with media attachment
    const statusResponse = await fetch(`${this.apiUrl}/statuses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        media_ids: [mediaData.id],
        visibility: 'public',
      }),
    });

    if (!statusResponse.ok) {
      const error = await statusResponse.json();
      throw new Error(`Truth Social API error: ${error.error || statusResponse.statusText}`);
    }

    const data = await statusResponse.json();

    return {
      type: 'status_with_media',
      id: data.id,
      text: data.content,
      url: data.url,
      mediaId: mediaData.id,
      createdAt: data.created_at,
    };
  }
}

module.exports = TruthSocialProvider;
