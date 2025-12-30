require('dotenv').config();

// Validate production configuration
const isProduction = process.env.NODE_ENV === 'production';
const publicUrl = process.env.PUBLIC_URL || '';
const isHttpsUrl = publicUrl.startsWith('https://');

if (isProduction && !isHttpsUrl) {
  console.warn('⚠️  WARNING: PUBLIC_URL should use HTTPS in production');
}

if (isProduction && process.env.COOKIE_SECURE === 'false') {
  console.warn('⚠️  WARNING: COOKIE_SECURE=false in production. Ensure proxy headers are configured.');
}

module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'https://joinruach.org'),
  proxy: env('NODE_ENV') === 'production', // Trust proxy headers in production
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
