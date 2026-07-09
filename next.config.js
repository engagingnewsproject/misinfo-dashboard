/** @type {import('next').NextConfig} */

const { i18n } = require('./next-i18next.config.js');

const useFirebaseEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

const nextConfig = {
  i18n,
  reactStrictMode: true,
  // Headers for static assets (migrated from netlify.toml for Firebase Hosting)
  async headers() {
    return [
      {
        source: '/_next/static/css/:path*',
        headers: [
          { key: 'Content-Type', value: 'text/css; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/js/:path*',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  // Optional: redirect legacy dev Netlify URL to dev truthsleuthlocal (only relevant if that URL is still in use)
  async redirects() {
    return [
      {
        source: '/site.webmanifest',
        destination: '/manifest.json',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'dev-misinfo-dashboard.netlify.app' }],
        destination: 'https://dev-truthsleuthlocal.netlify.app/:path*',
        permanent: true,
      },
    ];
  },
  // App Hosting / some Cloud Run images may not expose `public/` at the site root; `beforeFiles`
  // rewrites run before static lookup so manifest and favicons still resolve.
  async rewrites() {
    const rootPublicFiles = [
      'manifest.json',
      'favicon.ico',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'icon-192x192.png',
      'icon-256x256.png',
      'icon-384x384.png',
      'icon-512x512.png',
      'apple-touch-icon.png',
      'safari-pinned-tab.svg',
      'robots.txt',
    ];
    return {
      beforeFiles: rootPublicFiles.map((file) => ({
        source: `/${file}`,
        destination: `/api/public-asset/${file}`,
      })),
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
    ...(useFirebaseEmulators ? { dangerouslyAllowLocalIP: true } : {}),
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          // fixes proxy-agent dependencies
          net: false,
          dns: false,
          tls: false,
          assert: false,
          // fixes next-i18next dependencies
          path: false,
          fs: false,
          // fixes mapbox dependencies
          events: false,
        }
      };
    }
    config.module.exprContextCritical = false; // Workaround to suppress next-i18next warning, see https://github.com/isaachinman/next-i18next/issues/1545

    return config;
  }
}

module.exports = nextConfig
