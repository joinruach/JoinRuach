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
      connect-src 'self' https://cdn.joinruach.org https://*.r2.cloudflarestorage.com https://api.convertkit.com https://plausible.io https://*.upstash.io;
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.joinruach.org" },
      { protocol: "https", hostname: "de7ae97c4bd0ce41a374a2020a210a82.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "386e3b06c98f5a09da2029423a4d47b6.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  },
  transpilePackages: ["@ruach/components", "@ruach/addons"],
  productionBrowserSourceMaps: false,
  serverExternalPackages: ["@resvg/resvg-js"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  }
};

export default nextConfig;
