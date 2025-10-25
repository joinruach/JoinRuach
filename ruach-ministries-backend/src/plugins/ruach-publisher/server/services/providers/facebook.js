/**
 * Facebook Provider
 *
 * Publishes posts to Facebook Page using the Graph API
 * Requires Page Access Token
 */

'use strict';

const BaseProvider = require('./base-provider');

class FacebookProvider extends BaseProvider {
  constructor(strapi) {
    super(strapi, 'Facebook');

    this.validateCredentials(['FACEBOOK_PAGE_ACCESS_TOKEN', 'FACEBOOK_PAGE_ID']);

    this.pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    this.pageId = process.env.FACEBOOK_PAGE_ID;
    this.apiVersion = process.env.FACEBOOK_API_VERSION || 'v18.0';
    this.apiUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * Publish post to Facebook Page
   *
   * @param {object} mediaItem - The media item to publish
   * @returns {Promise<object>} - Facebook post details
   */
  async publish(mediaItem) {
    this.logPublish(mediaItem, 'Publishing to Facebook Page');

    try {
      const publicUrl = this.getPublicUrl(mediaItem.slug);
      const message = this.formatCaption(
        mediaItem.shortDescription || mediaItem.description,
        mediaItem.hashtags,
        publicUrl
      );

      let postResult;

      // If there's a video URL, post as a link
      if (mediaItem.videoUrl) {
        postResult = await this.postLink(message, mediaItem.videoUrl, mediaItem);
      }
      // If there's a thumbnail, post as photo
      else if (mediaItem.thumbnail) {
        postResult = await this.postPhoto(message, mediaItem.thumbnail, mediaItem);
      }
      // Otherwise, post as text
      else {
        postResult = await this.postText(message, mediaItem);
      }

      this.logPublish(mediaItem, 'Successfully published to Facebook', {
        postId: postResult.id,
      });

      return postResult;
    } catch (error) {
      this.logError(mediaItem, error);
      throw error;
    }
  }

  /**
   * Post a link to Facebook
   */
  async postLink(message, link, mediaItem) {
    const fetch = (await import('node-fetch')).default;

    const params = new URLSearchParams({
      message,
      link,
      access_token: this.pageAccessToken,
    });

    const response = await fetch(`${this.apiUrl}/${this.pageId}/feed`, {
      method: 'POST',
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Facebook API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      type: 'link',
      id: data.id,
      postUrl: `https://facebook.com/${data.id}`,
      message,
      link,
    };
  }

  /**
   * Post a photo to Facebook
   */
  async postPhoto(message, thumbnail, mediaItem) {
    const fetch = (await import('node-fetch')).default;
    const FormData = (await import('form-data')).default;

    // Download thumbnail
    const thumbnailBuffer = await this.downloadThumbnail(thumbnail);

    if (!thumbnailBuffer) {
      // Fallback to text post if thumbnail download fails
      return await this.postText(message, mediaItem);
    }

    const formData = new FormData();
    formData.append('message', message);
    formData.append('source', thumbnailBuffer, {
      filename: 'thumbnail.jpg',
      contentType: 'image/jpeg',
    });
    formData.append('access_token', this.pageAccessToken);

    const response = await fetch(`${this.apiUrl}/${this.pageId}/photos`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Facebook API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      type: 'photo',
      id: data.id,
      postId: data.post_id,
      postUrl: `https://facebook.com/${data.post_id || data.id}`,
      message,
    };
  }

  /**
   * Post text-only to Facebook
   */
  async postText(message, mediaItem) {
    const fetch = (await import('node-fetch')).default;

    const params = new URLSearchParams({
      message,
      access_token: this.pageAccessToken,
    });

    const response = await fetch(`${this.apiUrl}/${this.pageId}/feed`, {
      method: 'POST',
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Facebook API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      type: 'text',
      id: data.id,
      postUrl: `https://facebook.com/${data.id}`,
      message,
    };
  }

  /**
   * Get Page info
   */
  async getPageInfo() {
    const fetch = (await import('node-fetch')).default;

    const params = new URLSearchParams({
      fields: 'id,name,followers_count,fan_count,username',
      access_token: this.pageAccessToken,
    });

    const response = await fetch(`${this.apiUrl}/${this.pageId}?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Facebook API error: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  }
}

module.exports = FacebookProvider;
