/**
 * Instagram Provider
 *
 * Publishes posts to Instagram using the Graph API
 * Requires Instagram Business Account connected to Facebook Page
 */

'use strict';

const BaseProvider = require('./base-provider');

class InstagramProvider extends BaseProvider {
  constructor(strapi) {
    super(strapi, 'Instagram');

    // Instagram requires a connected Facebook Business Page
    this.validateCredentials(['INSTAGRAM_BUSINESS_ACCOUNT_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN']);

    this.accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    this.accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    this.apiVersion = process.env.FACEBOOK_API_VERSION || 'v18.0';
    this.apiUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * Publish post to Instagram
   *
   * @param {object} mediaItem - The media item to publish
   * @returns {Promise<object>} - Instagram post details
   */
  async publish(mediaItem) {
    this.logPublish(mediaItem, 'Publishing to Instagram');

    try {
      const publicUrl = this.getPublicUrl(mediaItem.slug);
      const caption = this.formatCaption(
        mediaItem.shortDescription,
        mediaItem.hashtags,
        publicUrl
      );

      // Instagram requires an image URL
      if (!mediaItem.thumbnail || !mediaItem.thumbnail.url) {
        throw new Error('Instagram posts require a thumbnail image');
      }

      const result = await this.createMediaContainer(caption, mediaItem.thumbnail, mediaItem);

      this.logPublish(mediaItem, 'Successfully published to Instagram', {
        mediaId: result.id,
      });

      return result;
    } catch (error) {
      this.logError(mediaItem, error);
      throw error;
    }
  }

  /**
   * Create Instagram media container and publish
   */
  async createMediaContainer(caption, thumbnail, mediaItem) {
    const fetch = (await import('node-fetch')).default;

    // Get full thumbnail URL using base provider method
    const thumbnailUrl = this.getThumbnailUrl(thumbnail);

    if (!thumbnailUrl) {
      throw new Error('Thumbnail URL is required for Instagram posts');
    }

    this.logPublish(mediaItem, 'Using thumbnail URL for Instagram', { thumbnailUrl });

    // Step 1: Create media container
    const containerParams = new URLSearchParams({
      image_url: thumbnailUrl,
      caption,
      access_token: this.accessToken,
    });

    const containerResponse = await fetch(
      `${this.apiUrl}/${this.accountId}/media`,
      {
        method: 'POST',
        body: containerParams,
      }
    );

    if (!containerResponse.ok) {
      const error = await containerResponse.json();
      throw new Error(`Instagram API error: ${error.error?.message || containerResponse.statusText}`);
    }

    const containerData = await containerResponse.json();
    const creationId = containerData.id;

    // Step 2: Publish the container
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: this.accessToken,
    });

    const publishResponse = await fetch(
      `${this.apiUrl}/${this.accountId}/media_publish`,
      {
        method: 'POST',
        body: publishParams,
      }
    );

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      throw new Error(`Instagram API error: ${error.error?.message || publishResponse.statusText}`);
    }

    const publishData = await publishResponse.json();

    return {
      type: 'image',
      id: publishData.id,
      permalink: `https://www.instagram.com/p/${publishData.id}`,
      caption,
    };
  }
}

module.exports = InstagramProvider;
