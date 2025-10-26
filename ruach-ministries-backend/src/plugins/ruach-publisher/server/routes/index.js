/**
 * Ruach Publisher - Routes
 *
 * API routes for the publisher plugin
 */

'use strict';

module.exports = [
  {
    method: 'POST',
    path: '/publish/:id',
    handler: 'publisher.publish',
    config: {
      policies: [],
      auth: {
        scope: ['admin'],
      },
    },
  },
  {
    method: 'POST',
    path: '/retry/:id/:platform',
    handler: 'publisher.retry',
    config: {
      policies: [],
      auth: {
        scope: ['admin'],
      },
    },
  },
  {
    method: 'GET',
    path: '/status/:id',
    handler: 'publisher.getStatus',
    config: {
      policies: [],
      auth: {
        scope: ['admin'],
      },
    },
  },
  {
    method: 'GET',
    path: '/platforms',
    handler: 'publisher.getPlatforms',
    config: {
      policies: [],
      auth: {
        scope: ['admin'],
      },
    },
  },
];
