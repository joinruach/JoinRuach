const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      img-src 'self' https://cdn.joinruach.org data:;
      media-src 'self' https://cdn.joinruach.org data:;
      script-src 'self' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      connect-src *;
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["cdn.joinruach.org"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" }
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
