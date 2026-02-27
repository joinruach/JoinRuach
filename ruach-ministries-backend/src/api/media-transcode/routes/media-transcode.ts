/**
 * Media Transcode Routes
 *
 * Auth: All routes require authentication.
 * Mutations (queue, quick-queue) require studio operator role.
 * Reads (status, jobs) require any authenticated user.
 */

export default {
  routes: [
    {
      method: "POST",
      path: "/media-transcode/queue",
      handler: "media-transcode.queueTranscodingJob",
      config: {
        policies: ['global::require-studio-operator'],
      },
    },
    {
      method: "GET",
      path: "/media-transcode/status/:jobId",
      handler: "media-transcode.getJobStatus",
      config: {
        policies: ['global::is-authenticated-or-admin'],
      },
    },
    {
      method: "GET",
      path: "/media-transcode/jobs/:mediaItemId",
      handler: "media-transcode.listMediaJobs",
      config: {
        policies: ['global::is-authenticated-or-admin'],
      },
    },
    {
      method: "POST",
      path: "/media-transcode/quick-queue",
      handler: "media-transcode.quickQueueTranscodes",
      config: {
        policies: ['global::require-studio-operator'],
      },
    },
  ],
};
