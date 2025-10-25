/**
 * X (Twitter) Provider
 *
 * Publishes tweets using the X API v2
 * Requires Bearer Token or OAuth 2.0
 */

'use strict';

const BaseProvider = require('./base-provider');

class XProvider extends BaseProvider {
  constructor(strapi) {
    super(strapi, 'X');

    this.validateCredentials(['X_API_BEARER_TOKEN']);

    this.bearerToken = process.env.X_API_BEARER_TOKEN;
    this.apiUrl = 'https://api.twitter.com/2';
  }

  /**
   * Publish tweet
   *
   * @param {object} mediaItem - The media item to publish
   * @returns {Promise<object>} - Tweet details
   */
  async publish(mediaItem) {
    this.logPublish(mediaItem, 'Publishing to X (Twitter)');

    try {
      const publicUrl = this.getPublicUrl(mediaItem.slug);

      // X has a 280 character limit
      let text = mediaItem.shortDescription || mediaItem.title;

      // Add hashtags if there's space
      if (mediaItem.hashtags) {
        const hashtagText = `\n\n${mediaItem.hashtags}`;
        if ((text + hashtagText + publicUrl.length + 3) <= 280) {
          text += hashtagText;
        }
      }

      // Add URL
      text += `\n\n${publicUrl}`;

      const result = await this.postTweet(text, mediaItem);

      this.logPublish(mediaItem, 'Successfully published to X', {
        tweetId: result.id,
      });

      return result;
    } catch (error) {
      this.logError(mediaItem, error);
      throw error;
    }
  }

  /**
   * Post a tweet
   */
  async postTweet(text, mediaItem) {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`${this.apiUrl}/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`X API error: ${error.detail || error.title || response.statusText}`);
    }

    const data = await response.json();

    return {
      type: 'tweet',
      id: data.data.id,
      text: data.data.text,
      tweetUrl: `https://twitter.com/i/web/status/${data.data.id}`,
    };
  }
}

module.exports = XProvider;
