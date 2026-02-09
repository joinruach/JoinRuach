/**
 * Custom routes for recording-session
 * Provides endpoints for assets, transcript, EDL, and workflow actions
 */

const prefix = 'api::recording-session.recording-session';

export default {
  routes: [
    // ---- Read endpoints ----
    {
      method: 'GET',
      path: '/recording-sessions/:id/assets',
      handler: `${prefix}.findAssets`,
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/transcript',
      handler: `${prefix}.findTranscript`,
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/edl',
      handler: `${prefix}.findEDL`,
      config: { policies: [] },
    },

    // ---- Sync actions ----
    {
      method: 'POST',
      path: '/recording-sessions/:id/sync/approve',
      handler: `${prefix}.approveSync`,
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/sync/correct',
      handler: `${prefix}.correctSync`,
      config: { policies: [] },
    },

    // ---- Transcript actions ----
    {
      method: 'POST',
      path: '/recording-sessions/:id/transcript/compute',
      handler: `${prefix}.computeTranscript`,
      config: { policies: [] },
    },

    // ---- EDL actions ----
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/generate',
      handler: `${prefix}.generateEDL`,
      config: { policies: [] },
    },
    {
      method: 'PUT',
      path: '/recording-sessions/:id/edl',
      handler: `${prefix}.updateEDL`,
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/approve',
      handler: `${prefix}.approveEDL`,
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/recording-sessions/:id/edl/lock',
      handler: `${prefix}.lockEDL`,
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/recording-sessions/:id/edl/export/:format',
      handler: `${prefix}.exportEDL`,
      config: { policies: [] },
    },
  ],
};
