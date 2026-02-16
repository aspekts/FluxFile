/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@fluxfile/db',
    '@fluxfile/types',
    '@fluxfile/config',
    '@fluxfile/storage',
    '@fluxfile/queue',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    domains: [process.env.R2_PUBLIC_DOMAIN || 'localhost'],
  },
};

module.exports = nextConfig;
