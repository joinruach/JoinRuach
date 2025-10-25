/**
 * Ruach Publisher - Providers Service
 *
 * Manages platform-specific publishing providers
 */

'use strict';

const YouTubeProvider = require('./providers/youtube');
const FacebookProvider = require('./providers/facebook');
const InstagramProvider = require('./providers/instagram');
const XProvider = require('./providers/x');
const PatreonProvider = require('./providers/patreon');
const RumbleProvider = require('./providers/rumble');
const LocalsProvider = require('./providers/locals');
const TruthSocialProvider = require('./providers/truthsocial');

module.exports = ({ strapi }) => ({
  /**
   * Get the appropriate provider for a platform
   *
   * @param {string} platform - Platform name (youtube, facebook, etc.)
   * @returns {object} - Provider instance
   */
  getProvider(platform) {
    const providers = {
      youtube: new YouTubeProvider(strapi),
      facebook: new FacebookProvider(strapi),
      instagram: new InstagramProvider(strapi),
      x: new XProvider(strapi),
      twitter: new XProvider(strapi), // Alias for X
      patreon: new PatreonProvider(strapi),
      rumble: new RumbleProvider(strapi),
      locals: new LocalsProvider(strapi),
      truthsocial: new TruthSocialProvider(strapi),
    };

    const provider = providers[platform.toLowerCase()];

    if (!provider) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    return provider;
  },

  /**
   * Get list of all supported platforms
   *
   * @returns {Array<object>} - Platform information
   */
  getSupportedPlatforms() {
    return [
      { id: 'youtube', name: 'YouTube', icon: '▶️', requiresOAuth: true },
      { id: 'facebook', name: 'Facebook', icon: '📘', requiresOAuth: true },
      { id: 'instagram', name: 'Instagram', icon: '📸', requiresOAuth: true },
      { id: 'x', name: 'X (Twitter)', icon: '🐦', requiresOAuth: true },
      { id: 'patreon', name: 'Patreon', icon: '💰', requiresOAuth: true },
      { id: 'rumble', name: 'Rumble', icon: '📺', requiresOAuth: false },
      { id: 'locals', name: 'Locals', icon: '🌐', requiresOAuth: false },
      { id: 'truthsocial', name: 'Truth Social', icon: '✝️', requiresOAuth: true },
    ];
  },
});
