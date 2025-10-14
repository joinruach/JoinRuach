require('dotenv').config();

module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  settings: {
    timeout: 600000,
  },
  cors: {
    enabled: true,
    origin: env('CORS_ORIGIN') ? env.array('CORS_ORIGIN') : ['*'],
  },
});
