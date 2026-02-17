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
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

// Conditionally apply Sentry configuration only if auth token is available
if (process.env.SENTRY_AUTH_TOKEN) {
  const { withSentryConfig } = require('@sentry/nextjs');

  module.exports = withSentryConfig(nextConfig, {
    org: 'yarn-development-2w',
    project: 'javascript-nextjs',
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring',
    disableLogger: true,
    webpack: {
      automaticVercelMonitors: true,
      treeshake: {
        removeDebugLogging: true,
      },
    },
  });
} else {
  module.exports = nextConfig;
}
