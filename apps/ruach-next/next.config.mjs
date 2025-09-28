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
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }, // keep strict in CI if desired
  experimental: {
    turbo: {
      // using defaults; enables faster dev refresh with lower memory
    }
  }
};

export default nextConfig;
