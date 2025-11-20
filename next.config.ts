/** @type {import('next').NextConfig} */

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Makes sure that webpack doesn't try to resolve server-only modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'firebase-admin': false,
      };
    }
    return config;
  },
  experimental: {
    turbo: {
      resolveAlias: {
        'firebase-admin': '/node_modules/next/dist/build/webpack/alias.js',
      },
    },
  },
};

module.exports = withPWA(nextConfig);
