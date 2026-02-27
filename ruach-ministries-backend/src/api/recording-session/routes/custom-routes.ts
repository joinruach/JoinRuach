/**
 * Custom routes for recording-session
 * Provides endpoints for assets, transcript, EDL, and workflow actions
 *
 * Auth: All routes require authentication.
 * Mutations (POST/PUT) require studio operator role.
 * Reads (GET) require any authenticated user.
 */

const prefix = 'api::recording-session.recording-session';

export default {
  routes: [
    // ---- Read endpoints ----
    {
      method: 'GET',
      path: '/recording-sessions/:id/assets',
      handler: `${prefix}.findAssets`,
      config: { policies: ['global::is-authenticated-or-admin'] },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/transcript',
      handler: `${prefix}.findTranscript`,
      config: { policies: ['global::is-authenticated-or-admin'] },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/edl',
      handler: `${prefix}.findEDL`,
      config: { policies: ['global::is-authenticated-or-admin'] },
    },

    // ---- Sync actions ----
    {
      method: 'POST',
      path: '/recording-sessions/:id/sync/approve',
      handler: `${prefix}.approveSync`,
      config: { policies: ['global::require-studio-operator'] },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/sync/correct',
      handler: `${prefix}.correctSync`,
      config: { policies: ['global::require-studio-operator'] },
    },

    // ---- Transcript actions ----
    {
      method: 'POST',
      path: '/recording-sessions/:id/transcript/compute',
      handler: `${prefix}.computeTranscript`,
      config: { policies: ['global::require-studio-operator'] },
    },

    // ---- EDL actions ----
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/generate',
      handler: `${prefix}.generateEDL`,
      config: { policies: ['global::require-studio-operator'] },
    },
    {
      method: 'PUT',
      path: '/recording-sessions/:id/edl',
      handler: `${prefix}.updateEDL`,
      config: { policies: ['global::require-studio-operator'] },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/approve',
      handler: `${prefix}.approveEDL`,
      config: { policies: ['global::require-studio-operator'] },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/lock',
      handler: `${prefix}.lockEDL`,
      config: { policies: ['global::require-studio-operator'] },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/edl/export/:format',
      handler: `${prefix}.exportEDL`,
      config: { policies: ['global::is-authenticated-or-admin'] },
    },
  ],
};
