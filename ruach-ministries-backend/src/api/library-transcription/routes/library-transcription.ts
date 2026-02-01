export default {
  routes: [
    {
      method: 'GET',
      path: '/library-transcriptions',
      handler: 'library-transcription.find',
      config: {
        auth: {
          scope: ['find'],
        },
      },
    },
    {
      method: 'GET',
      path: '/library-transcriptions/:id',
      handler: 'library-transcription.findOne',
      config: {
        auth: {
          scope: ['find'],
        },
      },
    },
    {
      method: 'POST',
      path: '/library-transcriptions',
      handler: 'library-transcription.create',
      config: {
        auth: {
          scope: ['create'],
        },
      },
    },
    {
      method: 'PUT',
      path: '/library-transcriptions/:id',
      handler: 'library-transcription.update',
      config: {
        auth: {
          scope: ['update'],
        },
      },
    },
    {
      method: 'DELETE',
      path: '/library-transcriptions/:id',
      handler: 'library-transcription.remove',
      config: {
        auth: {
          scope: ['delete'],
        },
      },
    },
  ],
};
