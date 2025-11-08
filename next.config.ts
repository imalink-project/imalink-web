import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.trollfjell.com',
        port: '',
        pathname: '/api/v1/**',
      },
    ],
  },
};

export default nextConfig;
