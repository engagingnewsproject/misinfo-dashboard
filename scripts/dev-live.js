/**
 * Starts Next against a real Firebase project for one of the four sites.
 *
 * No argument is Truth Sleuth live. Study targets share that app's Firebase
 * project and set the two fixed-agency variables that mark a study copy.
 *
 * Next still reads `.env.local` and only fills keys that are not already set,
 * so this copies the chosen file into the environment first. Keys that exist
 * only in `.env.local` are set to empty when another file is chosen, which
 * stops Truth Sleuth values from leaking into a Caffeine run.
 */
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const ROOT = path.join(__dirname, '..')

/** Prolific sample agency doc in misinfo-5d004. Same id as apphosting.study.yaml. */
const TRUTH_SLEUTH_STUDY_AGENCY_ID = 'DJuBydni2EqbezWzwDHJ'
const PROLIFIC_SAMPLE_NAME = 'Prolific sample'

const EMULATOR_HOST_VARS = [
	'FIRESTORE_EMULATOR_HOST',
	'FIREBASE_AUTH_EMULATOR_HOST',
	'FIREBASE_STORAGE_EMULATOR_HOST',
	'FIREBASE_DATABASE_EMULATOR_HOST',
	'FIREBASE_FUNCTIONS_EMULATOR_HOST',
]

const TARGETS = {
	ts: {
		label: 'Truth Sleuth',
		brand: 'misinfo',
		envFile: '.env.local',
		study: false,
	},
	'ts-study': {
		label: 'Truth Sleuth Study',
		brand: 'misinfo',
		envFile: '.env.local',
		study: true,
	},
	caffeine: {
		label: 'Caffeine',
		brand: 'caffeine',
		envFile: '.env.caffeine.local',
		study: false,
	},
	'caffeine-study': {
		label: 'Caffeine Study',
		brand: 'caffeine',
		envFile: '.env.caffeine.local',
		study: true,
	},
}

const ALIASES = {
	'': 'ts',
	ts: 'ts',
	truth: 'ts',
	truthsleuth: 'ts',
	'truth-sleuth': 'ts',
	misinfo: 'ts',
	'ts-study': 'ts-study',
	'truthsleuth-study': 'ts-study',
	'truth-sleuth-study': 'ts-study',
	caffeine: 'caffeine',
	'caffeine-study': 'caffeine-study',
}

/**
 * The four commands, printed when the app name is not recognized.
 * @returns {string}
 */
function usage() {
	return [
		'Usage:',
		'  npm run dev:live',
		'  npm run dev:live -- ts-study',
		'  npm run dev:live -- caffeine',
		'  npm run dev:live -- caffeine-study',
	].join('\n')
}

/**
 * Maps a command argument to a site. An empty name is Truth Sleuth live.
 * @param {string} [name]
 * @returns {(typeof TARGETS)[keyof typeof TARGETS] & { id: string } | null}
 */
function resolveTarget(name) {
	const key = (name || '').trim().toLowerCase()
	const id = ALIASES[key]
	if (!id) return null
	return { id, ...TARGETS[id] }
}

/**
 * @param {string} key
 * @returns {boolean}
 */
function isCopiedEnvKey(key) {
	return key.startsWith('NEXT_PUBLIC_') || key === 'GOOGLE_APPLICATION_CREDENTIALS'
}

/**
 * Agency id for a study target. Truth Sleuth's id is in the repo. Caffeine's
 * id lives in `.env.caffeine.local` as STUDY_AGENCY_ID.
 * @param {{ study: boolean, brand: string }} target
 * @param {Record<string, string>} targetFileEnv
 * @returns {string}
 */
function resolveStudyAgencyId(target, targetFileEnv) {
	if (!target.study) return ''
	if (target.brand === 'misinfo') return TRUTH_SLEUTH_STUDY_AGENCY_ID
	const id = (targetFileEnv.STUDY_AGENCY_ID || '').trim()
	if (!id) {
		throw new Error(
			'caffeine-study needs STUDY_AGENCY_ID in .env.caffeine.local (the Prolific sample agency id in the Caffeine Firebase project).',
		)
	}
	return id
}

/**
 * Env overlay applied before Next starts.
 * @param {{ baseEnv: Record<string, string>, targetEnv: Record<string, string>, target: { brand: string, study: boolean }, studyAgencyId?: string }} options
 * @returns {Record<string, string>}
 */
function buildLiveEnv({ baseEnv, targetEnv, target, studyAgencyId = '' }) {
	const keys = new Set(
		[...Object.keys(baseEnv), ...Object.keys(targetEnv)].filter(isCopiedEnvKey),
	)
	/** @type {Record<string, string>} */
	const env = {}
	for (const key of keys) {
		env[key] = Object.prototype.hasOwnProperty.call(targetEnv, key) ? targetEnv[key] : ''
	}
	env.NEXT_PUBLIC_USE_EMULATORS = 'false'
	env.NEXT_PUBLIC_BRAND = target.brand
	if (target.study) {
		env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID = studyAgencyId
		env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME = PROLIFIC_SAMPLE_NAME
	} else {
		env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID = ''
		env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME = ''
	}
	return env
}

/**
 * Drops emulator host variables so a shell profile cannot point the SDK at a
 * local port with no emulator running.
 * @param {NodeJS.ProcessEnv} env
 * @returns {NodeJS.ProcessEnv}
 */
function stripEmulatorHosts(env) {
	const next = { ...env }
	for (const key of EMULATOR_HOST_VARS) delete next[key]
	return next
}

/**
 * @param {string} filePath
 * @returns {Record<string, string>}
 */
function readEnvFile(filePath) {
	if (!fs.existsSync(filePath)) return {}
	return dotenv.parse(fs.readFileSync(filePath))
}

/**
 * @param {string[]} args - Arguments after the script name
 */
function main(args = process.argv.slice(2)) {
	if (args.length > 1) {
		console.error(usage())
		process.exit(1)
	}
	const target = resolveTarget(args[0])
	if (!target) {
		console.error(usage())
		process.exit(1)
	}

	const targetPath = path.join(ROOT, target.envFile)
	if (target.envFile !== '.env.local' && !fs.existsSync(targetPath)) {
		console.error(
			`Missing ${target.envFile}. Copy .env.caffeine.example to .env.caffeine.local and fill in the Caffeine Firebase values.`,
		)
		process.exit(1)
	}

	const baseEnv = readEnvFile(path.join(ROOT, '.env.local'))
	const targetFileEnv = readEnvFile(targetPath)
	let studyAgencyId = ''
	try {
		studyAgencyId = resolveStudyAgencyId(target, targetFileEnv)
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error))
		process.exit(1)
	}

	const overlay = buildLiveEnv({
		baseEnv,
		targetEnv: targetFileEnv,
		target,
		studyAgencyId,
	})
	const childEnv = stripEmulatorHosts({ ...process.env, ...overlay })
	const projectId = overlay.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'project id not set'
	console.log(`${target.label} → ${projectId}`)

	const nextBin = path.join(ROOT, 'node_modules', '.bin', 'next')
	const child = spawn(nextBin, ['dev', '--webpack'], {
		cwd: ROOT,
		stdio: 'inherit',
		env: childEnv,
	})
	child.on('error', (error) => {
		console.error(error.message)
		process.exit(1)
	})
	const stopChild = (signal) => {
		if (!child.killed) child.kill(signal)
	}
	process.on('SIGINT', () => stopChild('SIGINT'))
	process.on('SIGTERM', () => stopChild('SIGTERM'))
	child.on('exit', (code) => {
		process.exit(code == null ? 1 : code)
	})
}

module.exports = {
	TRUTH_SLEUTH_STUDY_AGENCY_ID,
	PROLIFIC_SAMPLE_NAME,
	EMULATOR_HOST_VARS,
	usage,
	resolveTarget,
	resolveStudyAgencyId,
	buildLiveEnv,
	stripEmulatorHosts,
}

if (require.main === module) {
	main()
}
