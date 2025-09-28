require('dotenv').config();

console.log("ENV VARIABLES LOADED:");
console.log("HOST:", process.env.HOST);
console.log("PORT:", process.env.PORT);
console.log("APP_KEYS:", process.env.APP_KEYS);
console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);

export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),          // Listen on all interfaces by default
  port: env.int('PORT', 1337),           // Default port is 1337
  app: {
    keys: env.array('APP_KEYS'),       // Array of application keys for cookie/signing
  },
  settings: {
    timeout: 600000,                   // Request timeout set to 10 minutes
  },
  cors: {
    enabled: true,
    origin: env('CORS_ORIGIN') ? env.array('CORS_ORIGIN') : ['*'], // Allow specific origins if defined, otherwise allow all
  },
});
