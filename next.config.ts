import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-4288a2bf7b6345c488d13d1481543425.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
