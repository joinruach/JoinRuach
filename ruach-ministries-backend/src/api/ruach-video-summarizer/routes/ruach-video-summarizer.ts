/**
 * Ruach Video Summarizer Routes
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/ruach-video-summarizer/summarize',
      handler: 'ruach-video-summarizer.summarize',
      config: {
        auth: {
          scope: ['create'],
        },
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/ruach-video-summarizer/:mediaId',
      handler: 'ruach-video-summarizer.get',
      config: {
        auth: {
          scope: ['find'],
        },
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/ruach-video-summarizer/:mediaId/chapters',
      handler: 'ruach-video-summarizer.chapters',
      config: {
        auth: {
          scope: ['find'],
        },
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/ruach-video-summarizer/:mediaId/search',
      handler: 'ruach-video-summarizer.search',
      config: {
        auth: {
          scope: ['find'],
        },
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/ruach-video-summarizer/:mediaId/regenerate',
      handler: 'ruach-video-summarizer.regenerate',
      config: {
        auth: {
          scope: ['update'],
        },
        policies: [],
        middlewares: [],
      },
    },
  ],
};
