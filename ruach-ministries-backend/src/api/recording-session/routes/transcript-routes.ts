/**
 * Phase 10: Transcript Routes
 *
 * Custom routes for session transcription operations
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/recording-sessions/:id/transcript/compute',
      handler: 'transcript-controller.compute',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/transcript',
      handler: 'transcript-controller.get',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/transcript/srt/:camera',
      handler: 'transcript-controller.getSRT',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/transcript/vtt/:camera',
      handler: 'transcript-controller.getVTT',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
