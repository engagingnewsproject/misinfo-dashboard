#!/usr/bin/env node
/**
 * Recreate missing `mobileUsers/{uid}` docs for Auth users that still exist.
 *
 * Document ID is always the Auth UID. Email is only used to look up the UID.
 *
 * Prerequisites:
 * - Service account JSON at repo root (misinfo-*-firebase-adminsdk*.json, gitignored)
 *   or GOOGLE_APPLICATION_CREDENTIALS / --service-account=path
 *
 * Usage:
 *   node scripts/restore-mobile-user.js --uid=OnIAUUO8ZvWUlz92LcN9GIyXOrc2
 *   node scripts/restore-mobile-user.js --email=utengagement@gmail.com
 *   node scripts/restore-mobile-user.js --uid=abc --email=a@b.com --dry-run
 *   node scripts/restore-mobile-user.js --find-orphans --dry-run
 *   node scripts/restore-mobile-user.js --find-orphans --limit=20
 *   node scripts/restore-mobile-user.js --uid=abc --force
 *   node scripts/restore-mobile-user.js --uid=abc --role=Agency --name="Jane Doe"
 */

const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

const PROJECT_ID = 'misinfo-5d004'
const VALID_ROLES = new Set(['User', 'Agency', 'Admin'])

/**
 * @typedef {Object} CliOptions
 * @property {boolean} dryRun
 * @property {boolean} force
 * @property {boolean} findOrphans
 * @property {number} limit
 * @property {string[]} uids
 * @property {string[]} emails
 * @property {string | null} name
 * @property {string | null} role
 * @property {string | null} agency
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
		force: false,
		findOrphans: false,
		limit: 0,
		uids: [],
		emails: [],
		name: null,
		role: null,
		agency: null,
		emulatorHost: null,
		serviceAccountPath: null,
	}

	for (const arg of argv) {
		if (arg === '--dry-run') {
			opts.dryRun = true
		} else if (arg === '--force') {
			opts.force = true
		} else if (arg === '--find-orphans') {
			opts.findOrphans = true
		} else if (arg.startsWith('--limit=')) {
			const n = Number.parseInt(arg.slice('--limit='.length), 10)
			if (!Number.isFinite(n) || n < 0) {
				throw new Error('--limit must be a non-negative integer (0 = no limit)')
			}
			opts.limit = n
		} else if (arg.startsWith('--uid=')) {
			const uid = arg.slice('--uid='.length).trim()
			if (uid) opts.uids.push(uid)
		} else if (arg.startsWith('--email=')) {
			const email = arg.slice('--email='.length).trim()
			if (email) opts.emails.push(email)
		} else if (arg.startsWith('--name=')) {
			opts.name = arg.slice('--name='.length)
		} else if (arg.startsWith('--role=')) {
			opts.role = arg.slice('--role='.length)
		} else if (arg.startsWith('--agency=')) {
			opts.agency = arg.slice('--agency='.length)
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

	if (opts.role && !VALID_ROLES.has(opts.role)) {
		throw new Error(`--role must be one of: ${[...VALID_ROLES].join(', ')}`)
	}

	if (!opts.findOrphans && opts.uids.length === 0 && opts.emails.length === 0) {
		throw new Error(
			'Provide --uid=, --email=, and/or --find-orphans. See --help.',
		)
	}

	return opts
}

function printHelp() {
	console.log(`
Recreate missing mobileUsers/{uid} docs from Firebase Auth.

  --uid=UID                 Auth UID (repeatable; used as Firestore doc id)
  --email=EMAIL             Look up Auth UID by email (repeatable)
  --find-orphans            Scan Auth users missing a mobileUsers doc (up to 1000)
  --dry-run                 Log actions without writing
  --force                   Overwrite an existing mobileUsers doc
  --limit=N                 With --find-orphans, restore at most N orphans (0 = all)
  --name=NAME               Override display name on created docs
  --role=User|Agency|Admin  Override role (default: from Auth custom claims)
  --agency=NAME             Set agency field when restoring Agency users
  --emulator-host=HOST:PORT Use Firestore/Auth emulators (set both env vars as needed)
  --service-account=PATH    Path to service account JSON
`)
}

/**
 * @param {CliOptions} opts
 */
function initAdmin(opts) {
	if (opts.emulatorHost) {
		process.env.FIRESTORE_EMULATOR_HOST = opts.emulatorHost
		// Auth emulator often shares the same host with a different port; callers can set
		// FIREBASE_AUTH_EMULATOR_HOST themselves when needed.
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
 * @param {admin.auth.UserRecord['customClaims']} customClaims
 * @returns {'User' | 'Agency' | 'Admin'}
 */
function userRoleFromClaims(customClaims) {
	if (!customClaims) return 'User'
	if (customClaims.admin === true) return 'Admin'
	if (customClaims.agency === true) return 'Agency'
	return 'User'
}

/**
 * @param {admin.auth.UserRecord} authUser
 * @returns {string}
 */
function defaultDisplayNameFromAuth(authUser) {
	const displayName =
		typeof authUser.displayName === 'string' ? authUser.displayName.trim() : ''
	if (displayName) return displayName
	const email = typeof authUser.email === 'string' ? authUser.email.trim() : ''
	if (email.includes('@')) return email.split('@')[0] || email
	return email || 'Restored user'
}

/**
 * @param {admin.auth.UserRecord} authUser
 * @param {CliOptions} opts
 * @returns {Record<string, unknown>}
 */
function buildProfile(authUser, opts) {
	const profile = {
		name: opts.name != null ? opts.name : defaultDisplayNameFromAuth(authUser),
		email: authUser.email || '',
		joiningDate: Math.floor(
			new Date(authUser.metadata.creationTime).getTime() / 1000,
		),
		state: '',
		city: '',
		isBanned: false,
		userRole: opts.role || userRoleFromClaims(authUser.customClaims),
		contact: false,
	}
	if (opts.agency) {
		profile.agency = opts.agency
	}
	return profile
}

/**
 * @param {string} uid
 * @returns {Promise<admin.auth.UserRecord>}
 */
async function getAuthUserByUid(uid) {
	return admin.auth().getUser(uid)
}

/**
 * @param {string} email
 * @returns {Promise<admin.auth.UserRecord>}
 */
async function getAuthUserByEmail(email) {
	return admin.auth().getUserByEmail(email)
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {admin.auth.UserRecord} authUser
 * @param {CliOptions} opts
 * @returns {Promise<'created' | 'skipped_exists' | 'would_create' | 'would_overwrite' | 'overwritten'>}
 */
async function restoreOne(db, authUser, opts) {
	const ref = db.collection('mobileUsers').doc(authUser.uid)
	const existing = await ref.get()
	const profile = buildProfile(authUser, opts)

	if (existing.exists && !opts.force) {
		console.log(
			`skip  ${authUser.uid} (${authUser.email || 'no-email'}): mobileUsers doc already exists (pass --force to overwrite)`,
		)
		return 'skipped_exists'
	}

	if (opts.dryRun) {
		const action = existing.exists ? 'would_overwrite' : 'would_create'
		console.log(
			`[dry-run] ${action} mobileUsers/${authUser.uid}`,
			JSON.stringify(profile),
		)
		return action
	}

	await ref.set(profile)
	const action = existing.exists ? 'overwritten' : 'created'
	console.log(
		`${action} mobileUsers/${authUser.uid} (${authUser.email || 'no-email'}) role=${profile.userRole}`,
	)
	return action
}

/**
 * @param {CliOptions} opts
 * @returns {Promise<admin.auth.UserRecord[]>}
 */
async function resolveTargets(opts) {
	/** @type {Map<string, admin.auth.UserRecord>} */
	const byUid = new Map()

	for (const uid of opts.uids) {
		const user = await getAuthUserByUid(uid)
		byUid.set(user.uid, user)
	}

	for (const email of opts.emails) {
		const user = await getAuthUserByEmail(email)
		byUid.set(user.uid, user)
	}

	if (opts.findOrphans) {
		const listed = await admin.auth().listUsers(1000)
		const db = admin.firestore()
		let orphanCount = 0
		for (const user of listed.users) {
			if (opts.limit > 0 && orphanCount >= opts.limit) {
				break
			}
			const snap = await db.collection('mobileUsers').doc(user.uid).get()
			if (!snap.exists) {
				byUid.set(user.uid, user)
				orphanCount += 1
			}
		}
		console.log(
			`Auth scan: ${listed.users.length} users listed, ${orphanCount} missing mobileUsers added as targets.`,
		)
	}

	return [...byUid.values()]
}

/**
 * @param {CliOptions} opts
 */
async function run(opts) {
	initAdmin(opts)
	const db = admin.firestore()
	const targets = await resolveTargets(opts)

	if (targets.length === 0) {
		console.log('No Auth users to restore.')
		return
	}

	/** @type {Record<string, number>} */
	const counts = {
		created: 0,
		overwritten: 0,
		skipped_exists: 0,
		would_create: 0,
		would_overwrite: 0,
	}

	for (const authUser of targets) {
		const result = await restoreOne(db, authUser, opts)
		counts[result] = (counts[result] || 0) + 1
	}

	console.log(
		JSON.stringify(
			{
				dryRun: opts.dryRun,
				force: opts.force,
				targets: targets.length,
				...counts,
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
