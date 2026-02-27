/**
 * Phase 10: Transcript Routes
 *
 * Custom routes for session transcription operations
 * Auth: All routes require authentication.
 * Mutations (POST) require studio operator role.
 * Reads (GET) require any authenticated user.
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/recording-sessions/:id/transcript/compute',
      handler: 'transcript-controller.compute',
      config: {
        policies: ['global::require-studio-operator'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/transcript',
      handler: 'transcript-controller.get',
      config: {
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/transcript/srt/:camera',
      handler: 'transcript-controller.getSRT',
      config: {
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/transcript/vtt/:camera',
      handler: 'transcript-controller.getVTT',
      config: {
        policies: ['global::is-authenticated-or-admin'],
        middlewares: [],
      },
    },
  ],
};
