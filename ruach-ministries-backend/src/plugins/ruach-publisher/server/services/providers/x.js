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
      // URLs are shortened to t.co links which are always 23 characters
      const URL_LENGTH = 23;
      const MAX_LENGTH = 280;

      let text = mediaItem.shortDescription || mediaItem.title;

      // Add hashtags if there's space
      if (mediaItem.hashtags) {
        const hashtagText = `\n\n${mediaItem.hashtags}`;
        // Calculate: current text + hashtags + newlines + URL length
        const totalLength = text.length + hashtagText.length + 2 + URL_LENGTH;

        if (totalLength <= MAX_LENGTH) {
          text += hashtagText;
        } else {
          // If hashtags don't fit, try to fit just the description
          if (text.length + 2 + URL_LENGTH > MAX_LENGTH) {
            // Truncate description to make room for URL
            const maxDescLength = MAX_LENGTH - URL_LENGTH - 5; // -5 for "...\n\n"
            text = text.substring(0, maxDescLength) + '...';
          }
        }
      }

      // Add URL
      text += `\n\n${publicUrl}`;

      const result = await this.postTweet(text, mediaItem);

      this.logPublish(mediaItem, 'Successfully published to X', {
        tweetId: result.id,
        textLength: text.length,
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
