export default {
  routes: [
    {
      method: "POST",
      path: "/media-transcode/queue",
      handler: "media-transcode.queueTranscodingJob",
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/media-transcode/status/:jobId",
      handler: "media-transcode.getJobStatus",
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/media-transcode/jobs/:mediaItemId",
      handler: "media-transcode.listMediaJobs",
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/media-transcode/quick-queue",
      handler: "media-transcode.quickQueueTranscodes",
      config: {
        policies: [],
        auth: false,
      },
    },
  ],
};
