/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
