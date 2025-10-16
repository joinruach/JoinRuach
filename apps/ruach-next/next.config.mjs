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
  serverExternalPackages: ["@resvg/resvg-js"]
};

export default nextConfig;
