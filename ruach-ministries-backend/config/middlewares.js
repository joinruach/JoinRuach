const isProduction = process.env.NODE_ENV === 'production';

const productionOrigins = [
  'https://ruachstudio.com',
  'https://www.ruachstudio.com',
];

const sharedOrigins = [
  'https://cdn.ruachstudio.com',
];

const developmentOrigins = [
  'http://localhost:1337',
  'http://127.0.0.1:1337',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const corsOrigins = isProduction
  ? [...productionOrigins, ...sharedOrigins]
  : [...productionOrigins, ...sharedOrigins, ...developmentOrigins];

const connectSrc = [
  "'self'",
  'wss://ruachstudio.com',
  'https://cdn.ruachstudio.com',
  'https://de7ae97c4bd0ce41a374a2020a210a82.r2.cloudflarestorage.com',
  'https://api.ruachstudio.com',
];

if (!isProduction) {
  connectSrc.push(...developmentOrigins, 'ws://localhost:1337', 'ws://localhost:3000');
}

module.exports = [
  'strapi::logger',
  'strapi::errors',

  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': connectSrc,
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https://cdn.ruachstudio.com',
            'https://de7ae97c4bd0ce41a374a2020a210a82.r2.cloudflarestorage.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'https://cdn.ruachstudio.com',
            'https://de7ae97c4bd0ce41a374a2020a210a82.r2.cloudflarestorage.com',
            'https://www.youtube.com',
            'https://player.vimeo.com',
          ],
          'frame-src': [
            "'self'",
            'https://www.youtube.com',
            'https://player.vimeo.com',
          ],
          'script-src': [
            "'self'",
            "'unsafe-inline'",
            'https://cdn.ruachstudio.com',
          ],
          'font-src': [
            "'self'",
            'https://fonts.gstatic.com',
          ],
        },
      },
    },
  },

  {
    name: 'strapi::cors',
    config: {
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
      headers: [
        'Content-Type',
        'Authorization',
        'Origin',
        'Accept',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Origin',
      ],
      credentials: true,
    },
  },

  'strapi::poweredBy',
  'strapi::query',

  {
    name: 'strapi::body',
    config: {
      formLimit: '10mb',
      jsonLimit: '50mb',
      textLimit: '10mb',
      formidable: {
        maxFileSize: 4 * 1024 * 1024 * 1024,
        timeout: 600000,
      },
    },
  },

  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
