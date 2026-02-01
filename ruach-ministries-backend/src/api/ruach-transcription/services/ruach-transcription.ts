/**
 * Ruach Transcription Service Entry Point
 * This service delegates to the library service (api::library.ruach-transcription)
 */

import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Delegate to library service
   */
  async queueTranscription(request: any) {
    return strapi.service('api::library.ruach-transcription').queueTranscription(request);
  },

  async getTranscription(transcriptionId: string) {
    return strapi.service('api::library.ruach-transcription').getTranscription(transcriptionId);
  },

  async regenerateSummary(transcriptionId: string) {
    return strapi.service('api::library.ruach-transcription').regenerateSummary(transcriptionId);
  },
});
