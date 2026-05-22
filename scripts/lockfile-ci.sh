#!/usr/bin/env bash
# Regenerate or verify package-lock.json using the same Linux + Node/npm
# toolchain as GitHub Actions and Firebase App Hosting.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_IMAGE="${NODE_IMAGE:-node:20.20.0}"
NPM_VERSION="${NPM_VERSION:-11.15.0}"

usage() {
	cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  ci | verify       Run npm ci in Linux (default before pushing lockfile changes)
  regen | install   Run npm install in Linux (updates package-lock.json)
  regen:fresh       Delete package-lock.json, then npm install (full regen)

Environment:
  NODE_IMAGE   Docker image (default: node:20.20.0)
  NPM_VERSION  Global npm in container (default: 11.15.0)

npm scripts: lockfile:ci, lockfile:regen, lockfile:regen:fresh
EOF
}

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required for lockfile scripts (CI and App Hosting install on Linux)." >&2
	echo "Install Docker Desktop, then re-run: npm run lockfile:ci" >&2
	exit 1
fi

docker_npm() {
	local inner_cmd="$1"
	docker run --rm -v "${ROOT}:/workspace" -w /workspace "${NODE_IMAGE}" bash -c "
		set -euo pipefail
		npm install -g npm@${NPM_VERSION} >/dev/null 2>&1
		node -v && npm -v
		${inner_cmd}
	"
}

cmd="${1:-}"
case "${cmd}" in
	ci | verify)
		echo "Verifying package-lock.json with npm ci (Linux ${NODE_IMAGE}, npm ${NPM_VERSION})..."
		docker_npm "rm -rf node_modules && npm ci"
		echo "lockfile:ci OK — safe to commit package-lock.json and open a PR."
		;;
	regen | install)
		echo "Regenerating package-lock.json with npm install (Linux)..."
		docker_npm "rm -rf node_modules && npm install"
		echo "Done. Run: npm run lockfile:ci — then commit package-lock.json."
		;;
	regen:fresh | fresh)
		echo "Full lockfile regen (removes package-lock.json first)..."
		docker_npm "rm -rf node_modules package-lock.json && npm install"
		echo "Done. Run: npm run lockfile:ci — then commit package-lock.json."
		;;
	-h | --help | help | "")
		usage
		[[ -n "${cmd}" ]] || exit 1
		;;
	*)
		echo "Unknown command: ${cmd}" >&2
		usage >&2
		exit 1
		;;
esac
