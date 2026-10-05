#!/usr/bin/env node
/**
 * Copy Firestore data from production into a running Firestore emulator.
 *
 * Prerequisites:
 * - Service account JSON at repo root (<project-id>-firebase-adminsdk*.json, gitignored)
 *   or GOOGLE_APPLICATION_CREDENTIALS / --service-account=path
 * - Firestore emulator listening (e.g. `npm run dev` or `firebase emulators:start --only firestore`)
 *
 * Usage:
 *   node scripts/seed-emulator-from-prod.js
 *   node scripts/seed-emulator-from-prod.js --limit=500 --with-settings
 *   node scripts/seed-emulator-from-prod.js --clear-reports --dry-run
 *   node scripts/seed-emulator-from-prod.js --collections=agency,tags,leftOutArticles,locations
 *
 * Copied docs are scrubbed so the result is safe to export into emulator-data/
 * (this repo is public): all emulator reports belong to user@user.com, admin
 * actions point at admin@user.com, agencies list agency@user.com as their only
 * user, and newsroom notes and image URLs are dropped. mobileUsers is never
 * copied; the emulator's own test users stay as they are.
 *
 * After seeding, open Settings → "Initialize experiment fields" if reports lack
 * experimentId/archived, then test archive flows safely on the emulator.
 */

const admin = require('firebase-admin')
const { FieldPath } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')

const { brand } = require('../config/brand')

// Set NEXT_PUBLIC_BRAND=caffeine (or FIREBASE_PROJECT_ID) to run against the Caffeine project.
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || brand.firebaseProjectId
const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080'
const DEFAULT_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
const TEST_REPORTER_EMAIL = 'user@user.com'
const TEST_ADMIN_EMAIL = 'admin@user.com'
const TEST_AGENCY_EMAIL = 'agency@user.com'
const ADMIN_ACTOR_FIELDS = ['archivedBy', 'movedBy', 'promotedBy']
const PAGE_SIZE = 500
const WRITE_BATCH_SIZE = 400

/**
 * @typedef {Object} CliOptions
 * @property {number} limit
 * @property {boolean} dryRun
 * @property {boolean} withSettings
 * @property {boolean} clearReports
 * @property {string[]} collections
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
		collections: [],
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
		} else if (arg.startsWith('--collections=')) {
			opts.collections = arg
				.slice('--collections='.length)
				.split(',')
				.map((name) => name.trim())
				.filter(Boolean)
			if (opts.collections.includes('reports')) {
				throw new Error(
					'--collections cannot include reports; use --limit to control reports',
				)
			}
			if (opts.collections.includes('mobileUsers')) {
				throw new Error(
					'--collections cannot include mobileUsers; it holds personal data',
				)
			}
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
Copy production Firestore reports (and optional settings/experiment and other
collections) into the emulator.

  node scripts/seed-emulator-from-prod.js [options]

Options:
  --limit=N              Max reports to copy (default: 200, 0 = all)
  --with-settings        Also copy settings/experiment
  --collections=A,B      Also copy every doc in these top-level collections
                         (e.g. agency,tags,leftOutArticles,locations).
                         Subcollections are not copied. mobileUsers is refused.

Reports are reassigned to ${TEST_REPORTER_EMAIL}, admin actions to
${TEST_ADMIN_EMAIL}, agency users to ${TEST_AGENCY_EMAIL}; notes and images are
dropped. Those test users must exist in the Auth emulator.
  --clear-reports        Delete emulator reports before import
  --emulator-host=HOST   Default: ${DEFAULT_EMULATOR_HOST}
  --service-account=PATH Override credentials JSON path
  --dry-run              Read prod only; print counts, no emulator writes
  -h, --help             Show this message

Credentials (first match):
  GOOGLE_APPLICATION_CREDENTIALS
  --service-account=PATH
  <project-id>-firebase-adminsdk*.json in repo root
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
				name.startsWith(`${PROJECT_ID}-firebase-adminsdk`) && name.endsWith('.json'),
		)
		.sort()
	if (matches.length === 0) {
		throw new Error(
			`No service account JSON found. Place ${PROJECT_ID}-firebase-adminsdk*.json at repo root or set GOOGLE_APPLICATION_CREDENTIALS.`,
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
	process.env.FIREBASE_AUTH_EMULATOR_HOST ||= DEFAULT_AUTH_EMULATOR_HOST
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
 * @param {string} collectionName
 * @param {number} limit 0 = no limit
 * @returns {Promise<Array<{ id: string, data: FirebaseFirestore.DocumentData }>>}
 */
async function fetchCollectionFromProd(db, collectionName, limit) {
	const out = []
	let lastId = null

	while (true) {
		const remaining =
			limit > 0 ? Math.min(PAGE_SIZE, limit - out.length) : PAGE_SIZE
		if (limit > 0 && remaining <= 0) {
			break
		}

		let q = db
			.collection(collectionName)
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
 * @typedef {Object} TestUids
 * @property {string} reporter
 * @property {string} admin
 */

/**
 * @param {import('firebase-admin').app.App} emuApp
 * @returns {Promise<TestUids>}
 */
async function resolveTestUids(emuApp) {
	const auth = emuApp.auth()
	const lookup = async (email) => {
		try {
			return (await auth.getUserByEmail(email)).uid
		} catch (err) {
			throw new Error(
				`Test user ${email} not found in the Auth emulator; start it with emulator-data imported`,
				{ cause: err },
			)
		}
	}
	const [reporter, admin] = await Promise.all([
		lookup(TEST_REPORTER_EMAIL),
		lookup(TEST_ADMIN_EMAIL),
	])
	return { reporter, admin }
}

/**
 * @param {FirebaseFirestore.DocumentData} data
 * @param {TestUids} uids
 */
function scrubActorFields(data, uids) {
	const out = { ...data }
	for (const field of ADMIN_ACTOR_FIELDS) {
		if (out[field]) out[field] = uids.admin
	}
	return out
}

/**
 * @param {string} collectionName
 * @param {Array<{ id: string, data: FirebaseFirestore.DocumentData }>} docs
 * @param {TestUids} uids
 */
function scrubDocs(collectionName, docs, uids) {
	return docs.map(({ id, data }) => {
		let clean = scrubActorFields(data, uids)
		if (collectionName === 'reports') {
			clean = { ...clean, userID: uids.reporter, note: '', images: [] }
		} else if (collectionName === 'agency') {
			clean = { ...clean, agencyUsers: [TEST_AGENCY_EMAIL] }
		}
		return { id, data: clean }
	})
}

/**
 * Points every emulator report (including ones from earlier imports) at the test
 * users, and every agency at the test agency user.
 *
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {TestUids} uids
 * @returns {Promise<{ reports: number, agencies: number }>}
 */
async function reassignAllToTestUsers(db, uids) {
	const fixes = []
	const reports = await db.collection('reports').get()
	for (const doc of reports.docs) {
		const data = doc.data()
		const patch = {}
		if (data.userID !== uids.reporter) patch.userID = uids.reporter
		for (const field of ADMIN_ACTOR_FIELDS) {
			if (data[field] && data[field] !== uids.admin) patch[field] = uids.admin
		}
		if (Object.keys(patch).length > 0) fixes.push({ ref: doc.ref, patch })
	}
	const reportFixes = fixes.length

	const agencies = await db.collection('agency').get()
	for (const doc of agencies.docs) {
		const users = doc.data().agencyUsers || []
		if (users.length !== 1 || users[0] !== TEST_AGENCY_EMAIL) {
			fixes.push({ ref: doc.ref, patch: { agencyUsers: [TEST_AGENCY_EMAIL] } })
		}
	}

	for (let i = 0; i < fixes.length; i += WRITE_BATCH_SIZE) {
		const batch = db.batch()
		for (const { ref, patch } of fixes.slice(i, i + WRITE_BATCH_SIZE)) {
			batch.update(ref, patch)
		}
		await batch.commit()
	}

	return { reports: reportFixes, agencies: fixes.length - reportFixes }
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {string} collectionName
 * @param {Array<{ id: string, data: FirebaseFirestore.DocumentData }>} docs
 * @returns {Promise<number>}
 */
async function writeCollectionToEmulator(db, collectionName, docs) {
	let written = 0

	for (let i = 0; i < docs.length; i += WRITE_BATCH_SIZE) {
		const chunk = docs.slice(i, i + WRITE_BATCH_SIZE)
		const batch = db.batch()
		for (const { id, data } of chunk) {
			batch.set(db.collection(collectionName).doc(id), data, { merge: false })
		}
		await batch.commit()
		written += chunk.length
	}

	return written
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {Array<{ id: string, data: FirebaseFirestore.DocumentData }>} reports
 * @param {{ id: string, data: FirebaseFirestore.DocumentData } | null} settings
 */
async function writeToEmulator(db, reports, settings) {
	const written = await writeCollectionToEmulator(db, 'reports', reports)

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
	if (opts.collections.length > 0) {
		console.log('Extra collections:', opts.collections.join(', '))
	}
	if (opts.dryRun) {
		console.log('Dry run: yes (no emulator writes)')
	}

	console.log('\nReading from production...')
	const prodApp = await initProdApp(serviceAccountPath)
	const prodDb = prodApp.firestore()

	const [reports, settings, extras] = await Promise.all([
		fetchCollectionFromProd(prodDb, 'reports', opts.limit),
		opts.withSettings
			? fetchExperimentSettings(prodDb)
			: Promise.resolve(null),
		Promise.all(
			opts.collections.map(async (name) => ({
				name,
				docs: await fetchCollectionFromProd(prodDb, name, 0),
			})),
		),
	])

	console.log(`Fetched ${reports.length} report(s) from production.`)
	for (const { name, docs } of extras) {
		console.log(`Fetched ${docs.length} doc(s) from ${name}.`)
	}
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

	const uids = await resolveTestUids(emuApp)
	console.log(
		`Scrubbing: reports → ${TEST_REPORTER_EMAIL}, admin actions → ${TEST_ADMIN_EMAIL}, agency users → ${TEST_AGENCY_EMAIL}`,
	)
	const cleanReports = scrubDocs('reports', reports, uids)
	const cleanExtras = extras.map(({ name, docs }) => ({
		name,
		docs: scrubDocs(name, docs, uids),
	}))

	if (opts.clearReports) {
		const removed = await clearEmulatorReports(emuDb)
		console.log(`Cleared ${removed} existing report(s) from emulator.`)
	}

	const { reportsWritten, settingsWritten } = await writeToEmulator(
		emuDb,
		cleanReports,
		settings,
	)

	console.log(`\nDone. Wrote ${reportsWritten} report(s) to emulator.`)
	if (settingsWritten) {
		console.log('Wrote settings/experiment to emulator.')
	}
	for (const { name, docs } of cleanExtras) {
		const n = await writeCollectionToEmulator(emuDb, name, docs)
		console.log(`Wrote ${n} doc(s) to ${name}.`)
	}
	const reassigned = await reassignAllToTestUsers(emuDb, uids)
	console.log(
		`Reassigned ${reassigned.reports} existing report(s) and ${reassigned.agencies} agency doc(s) to the test users.`,
	)
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
