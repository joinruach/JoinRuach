/**
 * Rumble Provider
 *
 * NOTE: Rumble has limited API access. This provider creates manual instructions.
 */

'use strict';

const BaseProvider = require('./base-provider');

class RumbleProvider extends BaseProvider {
  constructor(strapi) {
    super(strapi, 'Rumble');

    // Rumble API is limited - may need manual posting or API key
    if (process.env.RUMBLE_API_KEY) {
      this.apiKey = process.env.RUMBLE_API_KEY;
    }
  }

  /**
   * Publish to Rumble
   *
   * Rumble's API is limited, so this returns manual instructions
   */
  async publish(mediaItem) {
    this.logPublish(mediaItem, 'Generating Rumble post instructions');

    const publicUrl = this.getPublicUrl(mediaItem.slug);
    const description = this.formatCaption(
      mediaItem.description || mediaItem.shortDescription,
      mediaItem.hashtags,
      publicUrl
    );

    return {
      type: 'manual_required',
      platform: 'Rumble',
      message: 'Manual posting required for Rumble',
      instructions: [
        '1. Go to https://rumble.com/upload',
        '2. Click "Upload Video"',
        `3. Title: ${mediaItem.title}`,
        `4. Description: ${description}`,
        '5. Add thumbnail if available',
        `6. Link back to: ${publicUrl}`,
        '7. Select category and privacy settings',
        '8. Click "Publish"',
      ],
      title: mediaItem.title,
      description,
      publicUrl,
    };
  }
}

module.exports = RumbleProvider;
