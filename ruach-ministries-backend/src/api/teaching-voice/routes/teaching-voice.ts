/**
 * Teaching Voice Routes
 * API endpoints for managing and using teaching voice profiles
 */

export default {
  routes: [
    // Get all active teaching voices
    {
      method: 'GET',
      path: '/teaching-voices',
      handler: 'teaching-voice.getActiveVoices',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Get a specific teaching voice
    {
      method: 'GET',
      path: '/teaching-voices/:voiceId',
      handler: 'teaching-voice.getVoice',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Preview voice with sample content
    {
      method: 'POST',
      path: '/teaching-voices/:voiceId/preview',
      handler: 'teaching-voice.previewVoice',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Initialize starter voices (admin only)
    {
      method: 'POST',
      path: '/teaching-voices/initialize',
      handler: 'teaching-voice.initializeVoices',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
        middlewares: [],
      },
    },
  ],
};
