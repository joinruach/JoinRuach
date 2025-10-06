require('dotenv').config();

console.log('ENV VARIABLES LOADED:');
console.log('HOST:', process.env.HOST);
console.log('PORT:', process.env.PORT);
console.log('APP_KEYS:', process.env.APP_KEYS);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

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
