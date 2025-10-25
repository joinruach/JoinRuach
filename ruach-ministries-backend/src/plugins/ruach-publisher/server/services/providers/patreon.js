/**
 * Patreon Provider
 *
 * Creates posts on Patreon using the Patreon API
 */

'use strict';

const BaseProvider = require('./base-provider');

class PatreonProvider extends BaseProvider {
  constructor(strapi) {
    super(strapi, 'Patreon');

    this.validateCredentials(['PATREON_ACCESS_TOKEN', 'PATREON_CAMPAIGN_ID']);

    this.accessToken = process.env.PATREON_ACCESS_TOKEN;
    this.campaignId = process.env.PATREON_CAMPAIGN_ID;
    this.apiUrl = 'https://www.patreon.com/api/oauth2/v2';
  }

  /**
   * Publish post to Patreon
   */
  async publish(mediaItem) {
    this.logPublish(mediaItem, 'Publishing to Patreon');

    try {
      const publicUrl = this.getPublicUrl(mediaItem.slug);
      const content = this.formatCaption(
        mediaItem.description || mediaItem.shortDescription,
        mediaItem.hashtags,
        publicUrl
      );

      const result = await this.createPost(mediaItem.title, content, publicUrl, mediaItem);

      this.logPublish(mediaItem, 'Successfully published to Patreon', {
        postId: result.id,
      });

      return result;
    } catch (error) {
      this.logError(mediaItem, error);
      throw error;
    }
  }

  async createPost(title, content, url, mediaItem) {
    const fetch = (await import('node-fetch')).default;

    const postData = {
      data: {
        type: 'post',
        attributes: {
          title,
          content,
          is_paid: false,
          is_public: true,
          url,
        },
        relationships: {
          campaign: {
            data: { type: 'campaign', id: this.campaignId },
          },
        },
      },
    };

    const response = await fetch(`${this.apiUrl}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Patreon API error: ${error.errors?.[0]?.detail || response.statusText}`);
    }

    const data = await response.json();

    return {
      type: 'post',
      id: data.data.id,
      title,
      url: data.data.attributes.url,
    };
  }
}

module.exports = PatreonProvider;
