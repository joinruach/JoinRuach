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
    config.ignoreWarnings.push(
      { module: /node_modules\/@resvg\/resvg-js/ }
    );

    return config;
  },
};

export default nextConfig;