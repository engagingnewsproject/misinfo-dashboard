/**
 * Rollup 4 loads a platform-specific optional package (e.g. @rollup/rollup-darwin-x64).
 * npm sometimes omits nested optional deps (https://github.com/npm/cli/issues/4828),
 * which breaks `next build` when @sentry/nextjs pulls Rollup into the webpack pipeline.
 *
 * This script runs after install: on macOS only, if the native binding for the current
 * process.arch is missing, run a targeted npm install for that exact package version.
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { arch, platform } = require('node:process');

if (platform !== 'darwin') {
	process.exit(0);
}

const bindingName =
	arch === 'arm64'
		? '@rollup/rollup-darwin-arm64'
		: arch === 'x64'
			? '@rollup/rollup-darwin-x64'
			: null;

if (!bindingName) {
	process.exit(0);
}

try {
	require.resolve(bindingName);
	process.exit(0);
} catch {
	// continue
}

const rollupPkgPath = path.join(__dirname, '..', 'node_modules', 'rollup', 'package.json');
let version = '4.60.3';
try {
	const rollupPkg = JSON.parse(fs.readFileSync(rollupPkgPath, 'utf8'));
	version =
		rollupPkg.optionalDependencies?.[bindingName] ??
		rollupPkg.version ??
		version;
} catch {
	// use fallback version
}

console.warn(
	`[postinstall] Missing ${bindingName} (Rollup native). Installing ${bindingName}@${version} to work around npm optional-deps hoisting.`,
);

execSync(`npm install --no-audit --no-fund "${bindingName}@${version}"`, {
	cwd: path.join(__dirname, '..'),
	stdio: 'inherit',
});
