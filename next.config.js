/** @type {import('next').NextConfig} */

const { i18n } = require('./next-i18next.config.js');
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: ({ url }) =>
          url.pathname.startsWith('/api/') ||
          url.hostname.includes('googleapis.com') ||
          url.hostname.includes('firebaseio.com') ||
          url.hostname.includes('firestore.googleapis.com') ||
          url.hostname.includes('identitytoolkit.googleapis.com') ||
          url.hostname.includes('securetoken.googleapis.com') ||
          url.hostname.includes('firebasestorage.googleapis.com'),
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-font-assets',
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-image-assets',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/_next\/static.+\.js$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static-js-assets',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/_next\/image\?url=.+$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-image',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\.(?:js)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-js-assets',
          expiration: {
            maxEntries: 48,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\.(?:css|less)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-style-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'next-data',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: ({ url }) => url.origin === self.location.origin,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'others',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60,
          },
        },
      },
    ],
  },
});

const useFirebaseEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

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
  'apple-touch-icon-180x180.png',
  'apple_splash_640.png',
  'apple_splash_750.png',
  'apple_splash_1125.png',
  'apple_splash_1242.png',
  'apple_splash_1536.png',
  'apple_splash_1668.png',
  'apple_splash_2048.png',
  'safari-pinned-tab.svg',
  'robots.txt',
];

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

module.exports = withPWA(nextConfig)
