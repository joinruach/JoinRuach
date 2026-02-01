export default {
  routes: [
    {
      method: 'POST',
      path: '/ruach-transcription/transcribe',
      handler: 'ruach-transcription.transcribe',
      config: {
        auth: {
          scope: ['create'],
        },
      },
    },
    {
      method: 'GET',
      path: '/ruach-transcription/:id',
      handler: 'ruach-transcription.getTranscription',
      config: {
        auth: {
          scope: ['find'],
        },
      },
    },
    {
      method: 'POST',
      path: '/ruach-transcription/:id/summarize',
      handler: 'ruach-transcription.regenerateSummary',
      config: {
        auth: {
          scope: ['update'],
        },
      },
    },
    {
      method: 'GET',
      path: '/ruach-transcription/media/:mediaId',
      handler: 'ruach-transcription.getMediaTranscription',
      config: {
        auth: {
          scope: ['find'],
        },
      },
    },
    {
      method: 'GET',
      path: '/ruach-transcription/:id/vtt',
      handler: 'ruach-transcription.downloadVTT',
      config: {
        auth: {
          scope: ['find'],
        },
      },
    },
    {
      method: 'GET',
      path: '/ruach-transcription/:id/srt',
      handler: 'ruach-transcription.downloadSRT',
      config: {
        auth: {
          scope: ['find'],
        },
      },
    },
  ],
};
