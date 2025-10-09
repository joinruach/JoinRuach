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
  // CI runs lint/TS ahead of next build, so skip redundant checks here
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["@resvg/resvg-js"]
};

export default nextConfig;
