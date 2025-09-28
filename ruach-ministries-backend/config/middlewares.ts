export default [
  "strapi::logger",
  "strapi::errors",

  // Security Middleware
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": [
            "'self'",
            "http://localhost:1337",
            "http://localhost:3000",
            "ws://localhost:1337",
            "ws://localhost:3000",
            "wss://ruachstudio.com",
            "https://cdn.ruachstudio.com",
            "https://de7ae97c4bd0ce41a374a2020a210a82.r2.cloudflarestorage.com",
            "http://18.218.253.181:1337",
            "https://api.ruachstudio.com"
          ],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "https://cdn.ruachstudio.com",
            "https://de7ae97c4bd0ce41a374a2020a210a82.r2.cloudflarestorage.com"
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "https://cdn.ruachstudio.com",
            "https://de7ae97c4bd0ce41a374a2020a210a82.r2.cloudflarestorage.com",
            "https://www.youtube.com",
            "https://player.vimeo.com"
          ],
          "frame-src": [
            "'self'",
            "https://www.youtube.com",
            "https://player.vimeo.com"
          ],
          "script-src": [
            "'self'",
            "'unsafe-inline'",
            "https://cdn.ruachstudio.com"
          ],
          "font-src": [
            "'self'",
            "https://fonts.gstatic.com"
          ]
        }
      }
    }
  },

  // ✅ Improved CORS Middleware
  {
    name: "strapi::cors",
    config: {
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:1337",
        "http://127.0.0.1:1337",
        "https://ruachstudio.com",
        "https://cdn.ruachstudio.com",
        "http://www.ruachstudio.com"
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
      headers: [
        "Content-Type",
        "Authorization",
        "Origin",
        "Accept",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Origin"
      ],
      credentials: true
    }
  },

  "strapi::poweredBy",
  "strapi::query",

  // ✅ Body Parsing Middleware
  {
    name: "strapi::body",
    config: {
      formLimit: "10mb",
      jsonLimit: "50mb",
      textLimit: "10mb",
      formidable: {
        maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB
        timeout: 600000 // 10 minutes
      }
    }
  },

  // ✅ REMOVE invalid custom CORS middleware 
  // The incorrect middleware was causing the error. If you need a custom CORS middleware, 
  // it should be defined as a separate function and included properly.

  "strapi::session",
  "strapi::favicon",
  "strapi::public"
];