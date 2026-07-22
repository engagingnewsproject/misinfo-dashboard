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

export default async function handler(req, res) {
  const raw = req.query.filename;
  const filename = Array.isArray(raw) ? raw[0] : raw;
  if (!filename || !CONTENT_TYPES[filename]) {
    return res.status(404).end();
  }

  const publicDir = path.join(process.cwd(), 'public');
  const filePath = path.join(publicDir, filename);
  if (!filePath.startsWith(publicDir)) {
    return res.status(404).end();
  }

  try {
    const buf = await fs.readFile(filePath);
    res.setHeader('Content-Type', CONTENT_TYPES[filename]);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.status(200).send(buf);
  } catch {
    res.status(404).end();
  }
}
