#!/usr/bin/env node
/**
 * Copy Firestore data from production into a running Firestore emulator.
 *
 * Prerequisites:
 * - Service account JSON at repo root (misinfo-*-firebase-adminsdk*.json, gitignored)
 *   or GOOGLE_APPLICATION_CREDENTIALS / --service-account=path
 * - Firestore emulator listening (e.g. `npm run dev` or `firebase emulators:start --only firestore`)
 *
 * Usage:
 *   node scripts/seed-emulator-from-prod.js
 *   node scripts/seed-emulator-from-prod.js --limit=500 --with-settings
 *   node scripts/seed-emulator-from-prod.js --clear-reports --dry-run
 *
 * After seeding, open Settings → "Initialize experiment fields" if reports lack
 * experimentId/archived, then test archive flows safely on the emulator.
 */

const admin = require('firebase-admin')
const { FieldPath } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')

const PROJECT_ID = 'misinfo-5d004'
const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080'
const PAGE_SIZE = 500
const WRITE_BATCH_SIZE = 400

/**
 * @typedef {Object} CliOptions
 * @property {number} limit
 * @property {boolean} dryRun
 * @property {boolean} withSettings
 * @property {boolean} clearReports
 * @property {string} emulatorHost
 * @property {string | null} serviceAccountPath
 */

/**
 * @returns {CliOptions}
 */
function parseArgs() {
	const argv = process.argv.slice(2)
	/** @type {CliOptions} */
	const opts = {
		limit: 200,
		dryRun: false,
		withSettings: false,
		clearReports: false,
		emulatorHost: DEFAULT_EMULATOR_HOST,
		serviceAccountPath: null,
	}

	for (const arg of argv) {
		if (arg === '--dry-run') {
			opts.dryRun = true
		} else if (arg === '--with-settings') {
			opts.withSettings = true
		} else if (arg === '--clear-reports') {
			opts.clearReports = true
		} else if (arg.startsWith('--limit=')) {
			const n = Number.parseInt(arg.slice('--limit='.length), 10)
			if (!Number.isFinite(n) || n < 0) {
				throw new Error('--limit must be a non-negative integer (0 = no limit)')
			}
			opts.limit = n
		} else if (arg.startsWith('--emulator-host=')) {
			opts.emulatorHost = arg.slice('--emulator-host='.length)
		} else if (arg.startsWith('--service-account=')) {
			opts.serviceAccountPath = arg.slice('--service-account='.length)
		} else if (arg === '--help' || arg === '-h') {
			printHelp()
			process.exit(0)
		} else {
			throw new Error(`Unknown argument: ${arg}`)
		}
	}

	return opts
}

function printHelp() {
	console.log(`\
Copy production Firestore reports (and optional settings/experiment) into the emulator.

  node scripts/seed-emulator-from-prod.js [options]

Options:
  --limit=N              Max reports to copy (default: 200, 0 = all)
  --with-settings        Also copy settings/experiment
  --clear-reports        Delete emulator reports before import
  --emulator-host=HOST   Default: ${DEFAULT_EMULATOR_HOST}
  --service-account=PATH Override credentials JSON path
  --dry-run              Read prod only; print counts, no emulator writes
  -h, --help             Show this message

Credentials (first match):
  GOOGLE_APPLICATION_CREDENTIALS
  --service-account=PATH
  misinfo-*-firebase-adminsdk*.json in repo root
`)
}

/**
 * @returns {string}
 */
function resolveServiceAccountPath(explicitPath) {
	if (explicitPath) {
		const resolved = path.resolve(explicitPath)
		if (!fs.existsSync(resolved)) {
			throw new Error(`Service account not found: ${resolved}`)
		}
		return resolved
	}
	if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		const resolved = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
		if (!fs.existsSync(resolved)) {
			throw new Error(
				`GOOGLE_APPLICATION_CREDENTIALS file not found: ${resolved}`,
			)
		}
		return resolved
	}
	const root = path.join(__dirname, '..')
	const matches = fs
		.readdirSync(root)
		.filter(
			(name) =>
				name.includes('firebase-adminsdk') && name.endsWith('.json'),
		)
		.sort()
	if (matches.length === 0) {
		throw new Error(
			'No service account JSON found. Place misinfo-*-firebase-adminsdk*.json at repo root or set GOOGLE_APPLICATION_CREDENTIALS.',
		)
	}
	return path.join(root, matches[0])
}

/**
 * @param {string} serviceAccountPath
 * @returns {Promise<import('firebase-admin').app.App>}
 */
async function initProdApp(serviceAccountPath) {
	delete process.env.FIRESTORE_EMULATOR_HOST
	const credential = admin.credential.cert(
		require(path.resolve(serviceAccountPath)),
	)
	return admin.initializeApp(
		{
			credential,
			projectId: PROJECT_ID,
		},
		'seed-prod',
	)
}

/**
 * @param {string} serviceAccountPath
 * @param {string} emulatorHost
 * @returns {Promise<import('firebase-admin').app.App>}
 */
async function initEmulatorApp(serviceAccountPath, emulatorHost) {
	process.env.FIRESTORE_EMULATOR_HOST = emulatorHost
	const credential = admin.credential.cert(
		require(path.resolve(serviceAccountPath)),
	)
	return admin.initializeApp(
		{
			credential,
			projectId: PROJECT_ID,
		},
		'seed-emulator',
	)
}

async function deleteAdminApps() {
	await Promise.all(
		admin.apps.map((app) => (app ? app.delete() : Promise.resolve())),
	)
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {number} limit
 * @returns {Promise<Array<{ id: string, data: FirebaseFirestore.DocumentData }>>}
 */
async function fetchReportsFromProd(db, limit) {
	const out = []
	let lastId = null

	while (true) {
		const remaining =
			limit > 0 ? Math.min(PAGE_SIZE, limit - out.length) : PAGE_SIZE
		if (limit > 0 && remaining <= 0) {
			break
		}

		let q = db
			.collection('reports')
			.orderBy(FieldPath.documentId())
			.limit(remaining)

		if (lastId) {
			q = q.startAfter(lastId)
		}

		const snap = await q.get()
		if (snap.empty) {
			break
		}

		for (const doc of snap.docs) {
			out.push({ id: doc.id, data: doc.data() })
			lastId = doc.id
		}

		if (snap.size < remaining) {
			break
		}
	}

	return out
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @returns {Promise<{ id: string, data: FirebaseFirestore.DocumentData } | null>}
 */
async function fetchExperimentSettings(db) {
	const ref = db.collection('settings').doc('experiment')
	const snap = await ref.get()
	if (!snap.exists) {
		return null
	}
	return { id: snap.id, data: snap.data() }
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 */
async function clearEmulatorReports(db) {
	let deleted = 0
	let lastId = null

	while (true) {
		let q = db
			.collection('reports')
			.orderBy(FieldPath.documentId())
			.limit(PAGE_SIZE)
		if (lastId) {
			q = q.startAfter(lastId)
		}

		const snap = await q.get()
		if (snap.empty) {
			break
		}

		const batch = db.batch()
		for (const doc of snap.docs) {
			batch.delete(doc.ref)
			lastId = doc.id
		}
		await batch.commit()
		deleted += snap.size

		if (snap.size < PAGE_SIZE) {
			break
		}
	}

	return deleted
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {Array<{ id: string, data: FirebaseFirestore.DocumentData }>} reports
 * @param {{ id: string, data: FirebaseFirestore.DocumentData } | null} settings
 */
async function writeToEmulator(db, reports, settings) {
	let written = 0

	for (let i = 0; i < reports.length; i += WRITE_BATCH_SIZE) {
		const chunk = reports.slice(i, i + WRITE_BATCH_SIZE)
		const batch = db.batch()
		for (const { id, data } of chunk) {
			batch.set(db.collection('reports').doc(id), data, { merge: false })
		}
		await batch.commit()
		written += chunk.length
	}

	if (settings) {
		await db
			.collection('settings')
			.doc(settings.id)
			.set(settings.data, { merge: false })
	}

	return { reportsWritten: written, settingsWritten: settings ? 1 : 0 }
}

async function main() {
	const opts = parseArgs()
	const serviceAccountPath = resolveServiceAccountPath(opts.serviceAccountPath)

	console.log('Service account:', serviceAccountPath)
	console.log('Production project:', PROJECT_ID)
	console.log('Emulator host:', opts.emulatorHost)
	console.log('Report limit:', opts.limit === 0 ? 'none (all pages)' : opts.limit)
	if (opts.dryRun) {
		console.log('Dry run: yes (no emulator writes)')
	}

	console.log('\nReading from production...')
	const prodApp = await initProdApp(serviceAccountPath)
	const prodDb = prodApp.firestore()

	const [reports, settings] = await Promise.all([
		fetchReportsFromProd(prodDb, opts.limit),
		opts.withSettings
			? fetchExperimentSettings(prodDb)
			: Promise.resolve(null),
	])

	console.log(`Fetched ${reports.length} report(s) from production.`)
	if (opts.withSettings) {
		console.log(
			settings
				? 'Fetched settings/experiment from production.'
				: 'No settings/experiment doc in production (skipped).',
		)
	}

	await deleteAdminApps()

	if (opts.dryRun) {
		console.log('\nDry run complete. Start emulators and re-run without --dry-run to import.')
		return
	}

	console.log('\nWriting to Firestore emulator...')
	const emuApp = await initEmulatorApp(serviceAccountPath, opts.emulatorHost)
	const emuDb = emuApp.firestore()

	try {
		await emuDb.collection('_seed_probe').doc('ping').set({ t: Date.now() })
		await emuDb.collection('_seed_probe').doc('ping').delete()
	} catch (err) {
		console.error(
			'\nCould not reach Firestore emulator. Start it first, e.g.:\n  npm run dev\n  firebase emulators:start --only firestore\n',
		)
		throw err
	}

	if (opts.clearReports) {
		const removed = await clearEmulatorReports(emuDb)
		console.log(`Cleared ${removed} existing report(s) from emulator.`)
	}

	const { reportsWritten, settingsWritten } = await writeToEmulator(
		emuDb,
		reports,
		settings,
	)

	console.log(`\nDone. Wrote ${reportsWritten} report(s) to emulator.`)
	if (settingsWritten) {
		console.log('Wrote settings/experiment to emulator.')
	}
	console.log(
		'\nNext: open http://localhost:3000 → Settings → Experiment & archive → Initialize experiment fields (if needed).',
	)
	console.log(
		'Optional: firebase emulators:export ./emulator-data — save this snapshot for future npm run dev imports.',
	)

	await deleteAdminApps()
}

main().catch((err) => {
	console.error(err.message || err)
	process.exit(1)
})
