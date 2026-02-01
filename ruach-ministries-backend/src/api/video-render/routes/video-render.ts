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
        policies: [],
        middlewares: [],
      },
    },
    // Queue new render
    {
      method: "POST",
      path: "/video-renders",
      handler: "video-render.create",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Get render status
    {
      method: "GET",
      path: "/video-renders/:renderId/status",
      handler: "video-render.status",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Cancel render
    {
      method: "POST",
      path: "/video-renders/:renderId/cancel",
      handler: "video-render.cancel",
      config: {
        policies: [],
        middlewares: [],
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
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/video-renders/quote",
      handler: "video-render.quote",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/video-renders/daily",
      handler: "video-render.daily",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/video-renders/declaration",
      handler: "video-render.declaration",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
