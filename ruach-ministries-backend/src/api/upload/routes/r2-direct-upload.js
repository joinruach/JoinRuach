/**
 * R2 Direct Upload Routes
 */

'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/upload/r2-direct/initiate',
      handler: 'r2-direct-upload.initiate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/upload/r2-direct/part-url',
      handler: 'r2-direct-upload.getPartUrl',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/upload/r2-direct/part-complete',
      handler: 'r2-direct-upload.partComplete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/upload/r2-direct/complete',
      handler: 'r2-direct-upload.complete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/upload/r2-direct/abort',
      handler: 'r2-direct-upload.abort',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/upload/r2-direct/status/:uploadId',
      handler: 'r2-direct-upload.getStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
