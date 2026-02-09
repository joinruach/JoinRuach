/**
 * Custom routes for recording-session
 * Provides endpoints for assets, transcript, and EDL
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/recording-sessions/:id/assets',
      handler: 'api::recording-session.recording-session.findAssets',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/transcript',
      handler: 'api::recording-session.recording-session.findTranscript',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/edl',
      handler: 'api::recording-session.recording-session.findEDL',
      config: {
        policies: [],
      },
    },
  ],
};
