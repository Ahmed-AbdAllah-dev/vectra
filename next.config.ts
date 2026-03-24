import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', 'picsum.photos'], // Added picsum.photos
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**', // Allow all paths from picsum.photos
      },
      {
        protocol: 'https',
        hostname: '**.picsum.photos', // Also allow subdomains
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
}

export default nextConfig;