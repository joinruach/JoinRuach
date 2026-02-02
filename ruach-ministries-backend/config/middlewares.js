const isProduction = process.env.NODE_ENV === 'production';

// Production-only origins (HTTPS required)
const productionOrigins = [
  'https://joinruach.org',
  'https://www.joinruach.org',
];

// Shared origins (accessible from all environments)
const sharedOrigins = [
  'https://cdn.joinruach.org',
];

// Development-only origins (HTTP allowed)
const developmentOrigins = [
  'http://localhost:1337',
  'http://127.0.0.1:1337',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Environment variable override (optional)
// Format: CORS_ALLOWED_ORIGINS=https://example.com,https://app.example.com
// SECURITY: Only use in development or with explicit production domains
const envOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : [];

// Validate environment origins in production
if (isProduction && envOrigins.length > 0) {
  const invalidOrigins = envOrigins.filter(origin => !origin.startsWith('https://'));
  if (invalidOrigins.length > 0) {
    console.error('❌ SECURITY ERROR: Non-HTTPS origins not allowed in production:', invalidOrigins);
    throw new Error('Production CORS origins must use HTTPS');
  }
  console.log('✅ Using custom CORS origins from environment:', envOrigins);
}

// Build final CORS origin list
// Priority: environment variable > hardcoded origins
const corsOrigins = envOrigins.length > 0
  ? envOrigins
  : isProduction
    ? [...productionOrigins, ...sharedOrigins]
    : [...productionOrigins, ...sharedOrigins, ...developmentOrigins];

// Log CORS configuration on startup
console.log(`🔒 CORS Configuration (${isProduction ? 'production' : 'development'}):`);
console.log('  Allowed origins:', corsOrigins.join(', '));

// SECURITY: Fail-safe check - never allow wildcard in production
if (isProduction && (corsOrigins.includes('*') || corsOrigins.length === 0)) {
  console.error('❌ SECURITY ERROR: CORS wildcard or empty origins not allowed in production');
  throw new Error('Production CORS must have explicit origins');
}

// Content Security Policy - connect-src allowlist
// This includes all external APIs and services the backend communicates with
const connectSrc = [
  "'self'",
  'https:',
  // WebSocket connections
  'wss://joinruach.org',
  'wss://*.upstash.io',  // Upstash Redis WebSockets
  // CDN and storage
  'https://cdn.joinruach.org',
  'https://de7ae97c4bd0ce41a374a2020a210a82.r2.cloudflarestorage.com',
  'https://386e3b06c98f5a09da2029423a4d47b6.r2.cloudflarestorage.com',
  'https://*.cloudflare.com',  // Cloudflare R2 and other services
  'https://ruachmedia.s3.us-east-2.amazonaws.com',
  // API endpoints
  'https://api.joinruach.org',
  'https://api.anthropic.com',  // Claude API
  'https://api.openai.com',     // OpenAI API
  'https://api.github.com',
  // Analytics and monitoring
  'https://analytics.strapi.io',
  // Font and CDN services
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdn.jsdelivr.net',
  // Payment processing
  'https://*.stripe.com',
];

if (!isProduction) {
  connectSrc.push(
    ...developmentOrigins,
    'ws://localhost:1337',
    'ws://localhost:3000',
    'ws://127.0.0.1:1337',
    'ws://127.0.0.1:3000'
  );
}

module.exports = [
  // CRITICAL: Enable proxy trust FIRST (before any middleware that checks ctx.request.secure)
  {
    name: 'global::proxy-trust',
    config: {},
  },

  'strapi::logger',
  'strapi::errors',

  // Custom HTTPS enforcement middleware (before other middleware)
  {
    name: 'global::https-enforce',
    config: {},
  },

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
            'https://cdn.joinruach.org',
            'https://de7ae97c4bd0ce41a374a2020a210a82.r2.cloudflarestorage.com',
            'https://386e3b06c98f5a09da2029423a4d47b6.r2.cloudflarestorage.com',
            'https://ruachmedia.s3.us-east-2.amazonaws.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'https://cdn.joinruach.org',
            'https://de7ae97c4bd0ce41a374a2020a210a82.r2.cloudflarestorage.com',
            'https://386e3b06c98f5a09da2029423a4d47b6.r2.cloudflarestorage.com',
            'https://ruachmedia.s3.us-east-2.amazonaws.com',
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
            "'unsafe-inline'",  // Required for Strapi admin panel
            "'unsafe-eval'",   // Required for Strapi admin panel
            'https://cdn.joinruach.org',
            'https://cdn.jsdelivr.net',
          ],
          'style-src': [
            "'self'",
            "'unsafe-inline'",  // Required for Strapi admin panel
            "'unsafe-hashes'", // Allow CSS rules injected via insertRule
            'https://fonts.googleapis.com',
            'https://cdn.joinruach.org',
            'https://cdn.jsdelivr.net',
          ],
          'font-src': [
            "'self'",
            'https://fonts.gstatic.com',
            'https://fonts.googleapis.com',
          ],
          'object-src': [
            "'none'",
          ],
          'base-uri': [
            "'self'",
          ],
          'form-action': [
            "'self'",
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
      formLimit: '50mb',  // Reasonable limit for form data
      jsonLimit: '10mb',  // Reasonable limit for JSON payloads
      textLimit: '10mb',  // Reasonable limit for text data
      formidable: {
        maxFileSize: 2 * 1024 * 1024 * 1024,  // 2GB max (validated per-type by upload-validator)
        timeout: 1200000,  // 20 minutes for large video uploads
      },
    },
  },

  // Upload validation middleware (validates file types, sizes, dimensions)
  {
    name: 'global::upload-validator',
    config: {},
  },

  // NOTE: Rate limiting removed from global middleware (was blocking admin panel)
  // Applied per-route in API endpoints that need it (see ruach-generation routes)

  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
