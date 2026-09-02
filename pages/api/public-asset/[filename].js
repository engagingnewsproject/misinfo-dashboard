import fs from 'fs/promises';
import path from 'path';

/** Root `public/` files we expose via rewrites when the host does not serve `public/` at /. */
const CONTENT_TYPES = {
  'manifest.json': 'application/manifest+json; charset=utf-8',
  'favicon.ico': 'image/x-icon',
  'favicon-16x16.png': 'image/png',
  'favicon-32x32.png': 'image/png',
  'icon-192x192.png': 'image/png',
  'icon-256x256.png': 'image/png',
  'icon-384x384.png': 'image/png',
  'icon-512x512.png': 'image/png',
  'apple-touch-icon.png': 'image/png',
  'apple-touch-icon-180x180.png': 'image/png',
  'apple_splash_640.png': 'image/png',
  'apple_splash_750.png': 'image/png',
  'apple_splash_1125.png': 'image/png',
  'apple_splash_1242.png': 'image/png',
  'apple_splash_1536.png': 'image/png',
  'apple_splash_1668.png': 'image/png',
  'apple_splash_2048.png': 'image/png',
  'safari-pinned-tab.svg': 'image/svg+xml',
  'robots.txt': 'text/plain; charset=utf-8',
};

const JS_CONTENT_TYPE = 'application/javascript; charset=utf-8';

/**
 * next-pwa writes hashed scripts into public/ at build time. Allow only those
 * known basename patterns (no path segments) so we can serve them on App Hosting.
 */
const PWA_JS_BASENAME =
  /^(?:sw\.js|workbox-[a-f0-9]+\.js|fallback-[a-f0-9]+\.js|swe-worker-[a-zA-Z0-9_-]+\.js)$/;

/**
 * @param {string} filename
 * @returns {string | null}
 */
function contentTypeFor(filename) {
  if (CONTENT_TYPES[filename]) return CONTENT_TYPES[filename];
  if (PWA_JS_BASENAME.test(filename)) return JS_CONTENT_TYPE;
  return null;
}

export default async function handler(req, res) {
  const raw = req.query.filename;
  const filename = Array.isArray(raw) ? raw[0] : raw;
  const contentType = filename ? contentTypeFor(filename) : null;
  if (!filename || !contentType || filename.includes('/') || filename.includes('\\')) {
    return res.status(404).end();
  }

  const publicDir = path.join(process.cwd(), 'public');
  const filePath = path.join(publicDir, filename);
  if (!filePath.startsWith(publicDir + path.sep) && filePath !== publicDir) {
    return res.status(404).end();
  }

  try {
    const buf = await fs.readFile(filePath);
    res.setHeader('Content-Type', contentType);
    // Keep SW scripts fresh so clients pick up new precache manifests after deploy.
    if (PWA_JS_BASENAME.test(filename)) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.setHeader('Service-Worker-Allowed', '/');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    }
    res.status(200).send(buf);
  } catch {
    res.status(404).end();
  }
}
