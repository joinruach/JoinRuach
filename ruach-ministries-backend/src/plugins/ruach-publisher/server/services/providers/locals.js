/**
 * Locals Provider
 *
 * NOTE: Locals has limited API access. This provider creates manual instructions.
 */

'use strict';

const BaseProvider = require('./base-provider');

class LocalsProvider extends BaseProvider {
  constructor(strapi) {
    super(strapi, 'Locals');

    // Locals API is limited - authentication tokens may be available
    if (process.env.LOCALS_AUTH_TOKEN) {
      this.authToken = process.env.LOCALS_AUTH_TOKEN;
    }
  }

  /**
   * Publish to Locals
   *
   * Locals API is limited, so this returns manual instructions
   */
  async publish(mediaItem) {
    this.logPublish(mediaItem, 'Generating Locals post instructions');

    const publicUrl = this.getPublicUrl(mediaItem.slug);
    const content = this.formatCaption(
      mediaItem.description || mediaItem.shortDescription,
      mediaItem.hashtags,
      publicUrl
    );

    // If auth token is available, attempt API posting
    if (this.authToken) {
      return await this.attemptApiPost(mediaItem, content, publicUrl);
    }

    // Otherwise, return manual instructions
    return {
      type: 'manual_required',
      platform: 'Locals',
      message: 'Manual posting required for Locals',
      instructions: [
        '1. Go to your Locals community dashboard',
        '2. Click "Create Post"',
        `3. Title: ${mediaItem.title}`,
        `4. Content: ${content}`,
        '5. Add media/link if desired',
        `6. Link: ${publicUrl}`,
        '7. Click "Publish"',
      ],
      title: mediaItem.title,
      content,
      publicUrl,
    };
  }

  /**
   * Attempt to post via API (if token available)
   */
  async attemptApiPost(mediaItem, content, publicUrl) {
    try {
      // Locals API endpoint (this may need to be updated based on actual API)
      const fetch = (await import('node-fetch')).default;

      const response = await fetch('https://api.locals.com/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: mediaItem.title,
          content,
          url: publicUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Locals API error: ${response.statusText}`);
      }

      const data = await response.json();

      this.logPublish(mediaItem, 'Successfully posted to Locals via API', {
        postId: data.id,
      });

      return {
        type: 'post',
        id: data.id,
        title: mediaItem.title,
        url: data.url || publicUrl,
      };
    } catch (error) {
      this.logError(mediaItem, error);

      // Fall back to manual instructions
      return {
        type: 'api_failed_manual_required',
        platform: 'Locals',
        message: 'API posting failed. Manual posting required.',
        error: error.message,
        instructions: [
          '1. Go to your Locals community dashboard',
          '2. Click "Create Post"',
          `3. Title: ${mediaItem.title}`,
          `4. Content: ${content}`,
          '5. Click "Publish"',
        ],
      };
    }
  }
}

module.exports = LocalsProvider;
