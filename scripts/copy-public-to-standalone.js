/**
 * App Hosting runs Next in standalone mode. The adapter often leaves a partial
 * `public/` in `.next/standalone` (NFT-traced files only) and then skips merging
 * the rest — so build-generated next-pwa files (`sw.js`, `workbox-*.js`, …) never
 * reach the container. Merge the full post-build `public/` into standalone.
 *
 * @see https://github.com/firebase/apphosting-adapters/issues/499
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcPublic = path.join(root, 'public');
const standaloneRoot = path.join(root, '.next', 'standalone');
const destPublic = path.join(standaloneRoot, 'public');

/**
 * Recursively copy files from `from` into `to`, overwriting on conflict.
 * @param {string} from
 * @param {string} to
 */
function mergeCopy(from, to) {
	fs.mkdirSync(to, { recursive: true });
	for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
		const src = path.join(from, entry.name);
		const dest = path.join(to, entry.name);
		if (entry.isDirectory()) {
			mergeCopy(src, dest);
		} else {
			fs.copyFileSync(src, dest);
		}
	}
}

if (!fs.existsSync(standaloneRoot)) {
	console.log(
		'[copy-public-to-standalone] No .next/standalone yet — skipping (normal for plain next start).',
	);
	process.exit(0);
}

if (!fs.existsSync(srcPublic)) {
	console.warn('[copy-public-to-standalone] Missing public/ — nothing to copy.');
	process.exit(0);
}

mergeCopy(srcPublic, destPublic);

const pwaFiles = fs
	.readdirSync(destPublic)
	.filter((name) => /^(sw\.js|workbox-.+\.js|fallback-.+\.js|swe-worker-.+\.js)$/.test(name));

console.log(
	`[copy-public-to-standalone] Merged public/ → .next/standalone/public/ (PWA: ${pwaFiles.join(', ') || 'none found'})`,
);
