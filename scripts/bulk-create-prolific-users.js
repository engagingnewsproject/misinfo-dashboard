#!/usr/bin/env node
/**
 * Bulk-create (or reset) Prolific study accounts from a one-email-per-line file.
 *
 * For each email: create Auth + mobileUsers, or if Auth already exists, set the
 * shared temp password and mustChangePassword so first login hits /choose-password.
 *
 * Runbook
 * -------
 * Truth Sleuth study (misinfo-5d004, Prolific sample agency):
 *   NEXT_PUBLIC_BRAND=misinfo \
 *   NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID=DJuBydni2EqbezWzwDHJ \
 *   NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME='Prolific sample' \
 *   node scripts/bulk-create-prolific-users.js \
 *     --file=LOCAL/csv-import/profilic-truthSleuth-batch.md \
 *     --emulator --dry-run
 *
 * Caffeine study (caffeine-app-d8cd8; set STUDY agency id from .env.caffeine.local):
 *   NEXT_PUBLIC_BRAND=caffeine \
 *   NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID=<STUDY_AGENCY_ID> \
 *   NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME='Prolific sample' \
 *   node scripts/bulk-create-prolific-users.js \
 *     --file=LOCAL/csv-import/profilic-caffeine-batch.md \
 *     --emulator --dry-run
 *
 * Emulator: --emulator points Auth at 127.0.0.1:9099 and Firestore at 127.0.0.1:8080.
 * Prod: omit --emulator; needs a service account JSON (see Credentials below).
 *
 * Default shared temp password: prolificPassword123@!
 * Override with --password=...  Participants must change it on first login.
 *
 * Credentials (prod, first match):
 *   --service-account=PATH
 *   GOOGLE_APPLICATION_CREDENTIALS
 *   <project-id>-firebase-adminsdk*.json in repo root
 */

const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

const { brand } = require('../config/brand')

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || brand.firebaseProjectId
const DEFAULT_PASSWORD = 'prolificPassword123@!'
const DEFAULT_AUTH_EMULATOR = '127.0.0.1:9099'
const DEFAULT_FIRESTORE_EMULATOR = '127.0.0.1:8080'

/**
 * @typedef {Object} CliOptions
 * @property {string} file
 * @property {string} password
 * @property {boolean} dryRun
 * @property {boolean} emulator
 * @property {number} limit
 * @property {string | null} serviceAccountPath
 * @property {string | null} signupSource
 */

/**
 * Parse one-email-per-line text: trim, skip blanks / non-emails, dedupe
 * case-insensitively (keep first occurrence).
 *
 * @param {string} text
 * @returns {string[]}
 */
function parseEmailList(text) {
	const seen = new Set()
	/** @type {string[]} */
	const out = []
	for (const rawLine of String(text || '').split(/\r?\n/)) {
		const line = rawLine.trim()
		if (!line || line.startsWith('#')) continue
		if (!line.includes('@')) continue
		const email = line.toLowerCase()
		if (seen.has(email)) continue
		seen.add(email)
		out.push(email)
	}
	return out
}

/**
 * @param {string[]} emails
 * @param {number} limit - 0 = no limit
 * @returns {string[]}
 */
function applyLimit(emails, limit) {
	if (!limit || limit <= 0) return emails
	return emails.slice(0, limit)
}

/**
 * Fields for a new study mobileUsers doc.
 *
 * @param {string} email
 * @param {string} signupSource
 * @returns {Record<string, unknown>}
 */
function buildNewMobileUserFields(email, signupSource) {
	return {
		name: '',
		email,
		joiningDate: Math.floor(Date.now() / 1000),
		state: null,
		city: null,
		isBanned: false,
		userRole: 'User',
		contact: false,
		signupSource,
		mustChangePassword: true,
	}
}

/**
 * @returns {CliOptions}
 */
function parseArgs(argv = process.argv.slice(2)) {
	/** @type {CliOptions} */
	const opts = {
		file: '',
		password: DEFAULT_PASSWORD,
		dryRun: false,
		emulator: false,
		limit: 0,
		serviceAccountPath: null,
		signupSource: null,
	}

	for (const arg of argv) {
		if (arg === '--dry-run') {
			opts.dryRun = true
		} else if (arg === '--emulator') {
			opts.emulator = true
		} else if (arg.startsWith('--file=')) {
			opts.file = arg.slice('--file='.length).trim()
		} else if (arg.startsWith('--password=')) {
			opts.password = arg.slice('--password='.length)
		} else if (arg.startsWith('--limit=')) {
			const n = Number.parseInt(arg.slice('--limit='.length), 10)
			if (!Number.isFinite(n) || n < 0) {
				throw new Error('--limit must be a non-negative integer (0 = no limit)')
			}
			opts.limit = n
		} else if (arg.startsWith('--service-account=')) {
			opts.serviceAccountPath = arg.slice('--service-account='.length)
		} else if (arg.startsWith('--signup-source=')) {
			opts.signupSource = arg.slice('--signup-source='.length).trim() || null
		} else if (arg === '--help' || arg === '-h') {
			printHelp()
			process.exit(0)
		} else {
			throw new Error(`Unknown argument: ${arg}`)
		}
	}

	if (!opts.file) {
		throw new Error('--file=PATH is required')
	}
	if (!opts.password || opts.password.length < 6) {
		throw new Error('--password must be at least 6 characters (Firebase Auth minimum)')
	}

	return opts
}

function printHelp() {
	console.log(`
Bulk-create or reset Prolific study Auth + mobileUsers accounts.

  node scripts/bulk-create-prolific-users.js --file=PATH [options]

Options:
  --file=PATH              One email per line (required)
  --password=STRING        Shared temp password (default: ${DEFAULT_PASSWORD})
  --signup-source=STRING   Override mobileUsers.signupSource (default: brand)
  --limit=N                Process at most N emails after dedupe (0 = all)
  --emulator               Use Auth 9099 + Firestore 8080 emulators
  --dry-run                Log actions without writing
  --service-account=PATH   Prod credentials JSON
  -h, --help               Show this message

Set NEXT_PUBLIC_BRAND and both FIXED_REPORT_AGENCY_* env vars for study
signupSource (truthsleuth-study / caffeine-study). See script header runbook.
`)
}

/**
 * @param {CliOptions} opts
 */
function initAdmin(opts) {
	if (opts.emulator) {
		process.env.FIREBASE_AUTH_EMULATOR_HOST =
			process.env.FIREBASE_AUTH_EMULATOR_HOST || DEFAULT_AUTH_EMULATOR
		process.env.FIRESTORE_EMULATOR_HOST =
			process.env.FIRESTORE_EMULATOR_HOST || DEFAULT_FIRESTORE_EMULATOR
	}

	const candidates = []
	if (opts.serviceAccountPath) {
		candidates.push(opts.serviceAccountPath)
	}
	if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		candidates.push(process.env.GOOGLE_APPLICATION_CREDENTIALS)
	}
	const root = path.resolve(__dirname, '..')
	if (fs.existsSync(root)) {
		for (const file of fs.readdirSync(root)) {
			if (file.startsWith(`${PROJECT_ID}-firebase-adminsdk`) && file.endsWith('.json')) {
				candidates.push(path.join(root, file))
			}
		}
	}

	const saPath = candidates.find((p) => p && fs.existsSync(p))
	if (!saPath && !opts.emulator) {
		throw new Error(
			'No service account found. Pass --service-account= or set GOOGLE_APPLICATION_CREDENTIALS, or use --emulator.',
		)
	}

	if (admin.apps.length) {
		return
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
 * @param {string} uid
 * @param {string} email
 * @param {string} signupSource
 * @param {boolean} dryRun
 */
async function ensureMobileUser(db, uid, email, signupSource, dryRun) {
	const ref = db.collection('mobileUsers').doc(uid)
	const snap = await ref.get()
	if (snap.exists) {
		if (dryRun) {
			console.log(`  [dry-run] would set mustChangePassword on mobileUsers/${uid}`)
			return
		}
		await ref.set({ mustChangePassword: true }, { merge: true })
		return
	}
	const fields = buildNewMobileUserFields(email, signupSource)
	if (dryRun) {
		console.log(`  [dry-run] would create mobileUsers/${uid}`)
		return
	}
	await ref.set(fields)
}

/**
 * @param {import('firebase-admin')} adminSdk
 * @param {string} email
 * @param {string} password
 * @param {string} signupSource
 * @param {boolean} dryRun
 * @returns {Promise<'created' | 'reset'>}
 */
async function upsertProlificUser(adminSdk, email, password, signupSource, dryRun) {
	const auth = adminSdk.auth()
	const db = adminSdk.firestore()

	let existing = null
	try {
		existing = await auth.getUserByEmail(email)
	} catch (err) {
		if (err?.code !== 'auth/user-not-found') {
			throw err
		}
	}

	if (!existing) {
		if (dryRun) {
			console.log(`  [dry-run] would create Auth user ${email}`)
			console.log(`  [dry-run] would create mobileUsers for ${email}`)
			return 'created'
		}
		const userRecord = await auth.createUser({
			email,
			password,
			emailVerified: true,
		})
		await ensureMobileUser(db, userRecord.uid, email, signupSource, false)
		return 'created'
	}

	if (dryRun) {
		console.log(`  [dry-run] would reset password for ${email} (${existing.uid})`)
	} else {
		await auth.updateUser(existing.uid, {
			password,
			emailVerified: true,
		})
	}
	await ensureMobileUser(db, existing.uid, email, signupSource, dryRun)
	return 'reset'
}

/**
 * @param {CliOptions} opts
 */
async function run(opts) {
	const filePath = path.resolve(opts.file)
	if (!fs.existsSync(filePath)) {
		throw new Error(`File not found: ${filePath}`)
	}

	const signupSource = opts.signupSource || brand.signupSource
	const raw = fs.readFileSync(filePath, 'utf8')
	const emails = applyLimit(parseEmailList(raw), opts.limit)

	console.log(`Project: ${PROJECT_ID}`)
	console.log(`Brand signupSource: ${signupSource}`)
	console.log(`File: ${filePath}`)
	console.log(`Emails after dedupe${opts.limit ? ` (limit ${opts.limit})` : ''}: ${emails.length}`)
	console.log(
		opts.emulator
			? `Emulator Auth=${process.env.FIREBASE_AUTH_EMULATOR_HOST || DEFAULT_AUTH_EMULATOR} Firestore=${process.env.FIRESTORE_EMULATOR_HOST || DEFAULT_FIRESTORE_EMULATOR}`
			: 'Target: production Firebase',
	)
	if (opts.dryRun) console.log('Mode: dry-run (no writes)')

	initAdmin(opts)

	let created = 0
	let reset = 0
	/** @type {{ email: string, error: string }[]} */
	const failed = []

	for (const email of emails) {
		try {
			const action = await upsertProlificUser(
				admin,
				email,
				opts.password,
				signupSource,
				opts.dryRun,
			)
			if (action === 'created') {
				created += 1
				console.log(`created ${email}`)
			} else {
				reset += 1
				console.log(`reset   ${email}`)
			}
		} catch (err) {
			const message = err?.message || String(err)
			failed.push({ email, error: message })
			console.error(`FAILED  ${email}: ${message}`)
		}
	}

	console.log('')
	console.log(
		`Done. created=${created} reset=${reset} failed=${failed.length} total=${emails.length}`,
	)
	if (failed.length) {
		for (const row of failed) {
			console.log(`  ${row.email}: ${row.error}`)
		}
		process.exitCode = 1
	}
}

async function main() {
	const opts = parseArgs()
	await run(opts)
}

module.exports = {
	DEFAULT_PASSWORD,
	parseEmailList,
	applyLimit,
	buildNewMobileUserFields,
	parseArgs,
	upsertProlificUser,
	ensureMobileUser,
}

if (require.main === module) {
	main().catch((err) => {
		console.error(err?.message || err)
		process.exit(1)
	})
}
