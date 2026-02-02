/**
 * Video Render Routes
 */

export default {
  routes: [
    // List user's renders
    {
      method: "GET",
      path: "/video-renders",
      handler: "video-render.find",
      config: {
        policies: ["global::is-authenticated-or-admin"],
        middlewares: ["global::video-render-rate-limit"],
      },
    },
    // Queue new render
    {
      method: "POST",
      path: "/video-renders",
      handler: "video-render.create",
      config: {
        policies: ["global::is-authenticated-or-admin"],
        middlewares: ["global::video-render-rate-limit"],
      },
    },
    // Get render status
    {
      method: "GET",
      path: "/video-renders/:renderId/status",
      handler: "video-render.status",
      config: {
        policies: ["global::is-authenticated-or-admin"],
        middlewares: ["global::video-render-rate-limit"],
      },
    },
    // Cancel render
    {
      method: "POST",
      path: "/video-renders/:renderId/cancel",
      handler: "video-render.cancel",
      config: {
        policies: ["global::is-authenticated-or-admin"],
        middlewares: ["global::video-render-rate-limit"],
      },
    },
    // Queue stats (admin)
    {
      method: "GET",
      path: "/video-renders/queue/stats",
      handler: "video-render.queueStats",
      config: {
        policies: ["admin::isAuthenticatedAdmin"],
        middlewares: [],
      },
    },

    // Quick render endpoints
    {
      method: "POST",
      path: "/video-renders/scripture",
      handler: "video-render.scripture",
      config: {
        policies: ["global::is-authenticated-or-admin"],
        middlewares: ["global::video-render-rate-limit"],
      },
    },
    {
      method: "POST",
      path: "/video-renders/quote",
      handler: "video-render.quote",
      config: {
        policies: ["global::is-authenticated-or-admin"],
        middlewares: ["global::video-render-rate-limit"],
      },
    },
    {
      method: "POST",
      path: "/video-renders/daily",
      handler: "video-render.daily",
      config: {
        policies: ["global::is-authenticated-or-admin"],
        middlewares: ["global::video-render-rate-limit"],
      },
    },
    {
      method: "POST",
      path: "/video-renders/declaration",
      handler: "video-render.declaration",
      config: {
        policies: ["global::is-authenticated-or-admin"],
        middlewares: ["global::video-render-rate-limit"],
      },
    },
  ],
};
