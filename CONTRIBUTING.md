# Contributing

Public docs: **[misinfo-dashboard wiki](https://github.com/engagingnewsproject/misinfo-dashboard/wiki)** ([Architecture](https://github.com/engagingnewsproject/misinfo-dashboard/wiki/Architecture), [Sites](https://github.com/engagingnewsproject/misinfo-dashboard/wiki/Sites), [Testing](https://github.com/engagingnewsproject/misinfo-dashboard/wiki/Testing), and more).

Study / deploy ops (private): [misinfo-dashboard-ops](https://github.com/engagingnewsproject/misinfo-dashboard-ops).

## Setup checklist

1. Use **Node 20.20.0** and **npm 11.15.0** (`.nvmrc`, `package.json` `engines`).
2. `npm install`
3. Ask a maintainer for Firebase `.env` / `.env.local` (see [Environment](https://github.com/engagingnewsproject/misinfo-dashboard/wiki/Environment)).
4. `npm run dev` (emulators) — app at http://localhost:3000

## Before you open a PR

- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build` if you changed app code, Next config, or dependencies
- [ ] `npm run test:rules-parity` if you changed Firestore rules or report access
- [ ] Lockfile: use `npm run lockfile:regen` / `lockfile:ci` when dependency changes break CI (see wiki Technical Documentation → Deployment)
- [ ] Branch from latest `main`; open a PR with a short summary and test notes

## Where things fail in CI

- Node/npm engine mismatch → match `.nvmrc` / `engines`
- Lockfile drift → `lockfile:ci` / regen scripts
- Rules tests → run `test:rules-parity` locally with Firebase emulators available
