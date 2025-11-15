import withPWA from "@ducanh2912/next-pwa";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      img-src 'self' https://cdn.joinruach.org https://*.r2.cloudflarestorage.com https://img.youtube.com https://i.ytimg.com data:;
      media-src 'self' https://cdn.joinruach.org https://*.r2.cloudflarestorage.com data:;
      script-src 'self' 'unsafe-inline' https://plausible.io;
      style-src 'self' 'unsafe-inline';
      frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.tiktok.com;
      connect-src 'self'
        https://cdn.joinruach.org
        https://*.r2.cloudflarestorage.com
        https://api.convertkit.com
        https://plausible.io
        https://*.upstash.io
        https://apparent-caribou-35103.upstash.io
        https://givebutter.com
        https://*.givebutter.com;
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.joinruach.org",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Handle .node files (native Node.js addons like @resvg/resvg-js)
    // Tell webpack to ignore/copy .node files without parsing them
    config.module.rules.push({
      test: /\.node$/,
      type: "asset/resource",
      generator: {
        filename: "static/chunks/[name].[hash][ext]",
      },
    });

    // Also configure webpack to not parse .node files
    config.module.noParse = config.module.noParse || [];
    if (Array.isArray(config.module.noParse)) {
      config.module.noParse.push(/\.node$/);
    } else {
      config.module.noParse = [config.module.noParse, /\.node$/];
    }

    // Suppress warnings for optional @resvg platform-specific binaries
    config.ignoreWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings.push({ module: /node_modules\/@resvg\/resvg-js/ });

    return config;
  },
};

export default withNextIntl(
  withPWA({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/cdn\.joinruach\.org\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "cdn-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.r2\.cloudflarestorage\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "r2-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "image-cache",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      {
        urlPattern: /\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5, // 5 minutes
          },
        },
      },
      {
        urlPattern: /.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "others",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
        },
      },
    ],
  })(nextConfig)
);
