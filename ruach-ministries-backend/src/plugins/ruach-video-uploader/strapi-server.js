'use strict';

/**
 * Ruach Video Uploader Plugin (Server)
 *
 * Minimal server entry to satisfy Strapi's plugin registry.
 */
module.exports = () => ({
  register({ strapi }) {
    strapi.log.debug('Registering ruach-video-uploader plugin');
  },
  bootstrap() {},
});
