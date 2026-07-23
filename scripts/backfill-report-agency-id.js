#!/usr/bin/env node
/**
 * Backfill `agencyId` on existing report documents from agency display name.
 *
 * Prerequisites:
 * - Service account JSON at repo root (misinfo-*-firebase-adminsdk*.json, gitignored)
 *   or GOOGLE_APPLICATION_CREDENTIALS / --service-account=path
 *
 * Usage:
 *   node scripts/backfill-report-agency-id.js --dry-run
 *   node scripts/backfill-report-agency-id.js
 *   node scripts/backfill-report-agency-id.js --limit=500
 *   node scripts/backfill-report-agency-id.js --emulator-host=127.0.0.1:8080
 */

const admin = require('firebase-admin')
const { FieldPath } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')

const PROJECT_ID = 'misinfo-5d004'
const PAGE_SIZE = 400

/**
 * @typedef {Object} CliOptions
 * @property {boolean} dryRun
 * @property {number} limit
 * @property {string | null} emulatorHost
 * @property {string | null} serviceAccountPath
 */

/**
 * @returns {CliOptions}
 */
function parseArgs() {
	const argv = process.argv.slice(2)
	/** @type {CliOptions} */
	const opts = {
		dryRun: false,
		limit: 0,
		emulatorHost: null,
		serviceAccountPath: null,
	}

	for (const arg of argv) {
		if (arg === '--dry-run') {
			opts.dryRun = true
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
	console.log(`
Backfill reports.agencyId from agency name → id map.

  --dry-run                 Log changes without writing
  --limit=N                 Process at most N reports missing agencyId (0 = all)
  --emulator-host=HOST:PORT Use Firestore emulator
  --service-account=PATH    Path to service account JSON
`)
}

/**
 * @param {CliOptions} opts
 */
function initAdmin(opts) {
	if (opts.emulatorHost) {
		process.env.FIRESTORE_EMULATOR_HOST = opts.emulatorHost
	}

	const candidates = []
	if (opts.serviceAccountPath) {
		candidates.push(opts.serviceAccountPath)
	}
	if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		candidates.push(process.env.GOOGLE_APPLICATION_CREDENTIALS)
	}
	const root = path.resolve(__dirname, '..')
	for (const file of fs.readdirSync(root)) {
		if (/misinfo-.*firebase-adminsdk.*\.json$/i.test(file)) {
			candidates.push(path.join(root, file))
		}
	}

	const saPath = candidates.find((p) => p && fs.existsSync(p))
	if (!saPath && !opts.emulatorHost) {
		throw new Error(
			'No service account found. Pass --service-account= or set GOOGLE_APPLICATION_CREDENTIALS.',
		)
	}

	if (saPath) {
		const sa = require(saPath)
		admin.initializeApp({
			credential: admin.credential.cert(sa),
			projectId: sa.project_id || PROJECT_ID,
		})
	} else {
		admin.initializeApp({ projectId: PROJECT_ID })
	}
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<Map<string, string>>}
 */
async function buildNameToIdMap(db) {
	const snap = await db.collection('agency').get()
	/** @type {Map<string, string>} */
	const map = new Map()
	snap.docs.forEach((docSnap) => {
		const name = String(docSnap.data()?.name || '').trim()
		if (!name) return
		map.set(name, docSnap.id)
		map.set(name.toLowerCase(), docSnap.id)
	})
	return map
}

/**
 * @param {CliOptions} opts
 */
async function run(opts) {
	initAdmin(opts)
	const db = admin.firestore()
	const nameToId = await buildNameToIdMap(db)
	console.log(`Loaded ${nameToId.size / 2} agencies (name→id map).`)

	let scanned = 0
	let updated = 0
	let alreadyHad = 0
	let unmatched = 0
	/** @type {string[]} */
	const unmatchedNames = []
	let lastDoc = null

	// eslint-disable-next-line no-constant-condition
	while (true) {
		let q = db.collection('reports').orderBy(FieldPath.documentId()).limit(PAGE_SIZE)
		if (lastDoc) {
			q = q.startAfter(lastDoc)
		}
		const snap = await q.get()
		if (snap.empty) break

		const batch = db.batch()
		let batchWrites = 0

		for (const docSnap of snap.docs) {
			if (opts.limit > 0 && scanned >= opts.limit) break
			scanned += 1
			const data = docSnap.data() || {}
			const existingId =
				typeof data.agencyId === 'string' ? data.agencyId.trim() : ''
			if (existingId) {
				alreadyHad += 1
				continue
			}

			const agencyName =
				typeof data.agency === 'string' ? data.agency.trim() : ''
			const resolved =
				(agencyName && nameToId.get(agencyName)) ||
				(agencyName && nameToId.get(agencyName.toLowerCase())) ||
				null

			if (!resolved) {
				unmatched += 1
				if (agencyName && !unmatchedNames.includes(agencyName)) {
					unmatchedNames.push(agencyName)
				}
				continue
			}

			if (opts.dryRun) {
				console.log(`[dry-run] ${docSnap.id}: agency="${agencyName}" → ${resolved}`)
			} else {
				batch.update(docSnap.ref, { agencyId: resolved })
				batchWrites += 1
			}
			updated += 1
		}

		if (!opts.dryRun && batchWrites > 0) {
			await batch.commit()
		}

		lastDoc = snap.docs[snap.docs.length - 1]
		if (snap.size < PAGE_SIZE) break
		if (opts.limit > 0 && scanned >= opts.limit) break
	}

	console.log(
		JSON.stringify(
			{
				dryRun: opts.dryRun,
				scanned,
				updated,
				alreadyHad,
				unmatched,
				unmatchedNames,
			},
			null,
			2,
		),
	)
}

try {
	run(parseArgs()).catch((err) => {
		console.error(err)
		process.exit(1)
	})
} catch (err) {
	console.error(err.message || err)
	process.exit(1)
}
