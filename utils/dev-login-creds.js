/**
 * Local-dev helpers for reading `.env.login` aliases (admin / agency / public).
 * Server-only — do not import from client bundles.
 */

import fs from 'fs'
import path from 'path'

export const DEV_LOGIN_ALIASES = /** @type {const} */ (['admin', 'agency', 'public'])

const ALIAS_KEYS = {
	admin: {
		email: 'LOGIN_ADMIN_EMAIL',
		password: 'LOGIN_ADMIN_PASSWORD',
	},
	agency: {
		email: 'LOGIN_AGENCY_EMAIL',
		password: 'LOGIN_AGENCY_PASSWORD',
	},
	public: {
		email: 'LOGIN_PUBLIC_EMAIL',
		password: 'LOGIN_PUBLIC_PASSWORD',
	},
}

/**
 * Parse KEY=VALUE lines from an env-style file (ignores comments / blanks).
 * @param {string} contents
 * @returns {Record<string, string>}
 */
export function parseEnvLoginFile(contents) {
	/** @type {Record<string, string>} */
	const out = {}
	for (const line of contents.split(/\r?\n/)) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue
		const eq = trimmed.indexOf('=')
		if (eq <= 0) continue
		out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
	}
	return out
}

/**
 * Load credentials for a login alias from `.env.login` at the repo root.
 * @param {string} alias
 * @returns {{ email: string, password: string }}
 */
export function readDevLoginCreds(alias) {
	const key = String(alias || '')
		.trim()
		.toLowerCase()
	const mapping = ALIAS_KEYS[/** @type {keyof typeof ALIAS_KEYS} */ (key)]
	if (!mapping) {
		const err = /** @type {Error & { statusCode?: number }} */ (
			new Error(`Unknown alias: ${alias}`)
		)
		err.statusCode = 400
		throw err
	}

	const filePath = path.join(process.cwd(), '.env.login')
	if (!fs.existsSync(filePath)) {
		const err = /** @type {Error & { statusCode?: number }} */ (
			new Error('.env.login not found')
		)
		err.statusCode = 404
		throw err
	}

	const env = parseEnvLoginFile(fs.readFileSync(filePath, 'utf8'))
	const email = env[mapping.email] || ''
	const password = env[mapping.password] || ''
	if (!email || !password) {
		const err = /** @type {Error & { statusCode?: number }} */ (
			new Error(
				`Missing ${mapping.email} / ${mapping.password} in .env.login`,
			)
		)
		err.statusCode = 404
		throw err
	}

	return { email, password }
}

/**
 * True when the request Host is a local loopback address.
 * @param {import('http').IncomingMessage} req
 */
export function isLocalDevRequest(req) {
	if (process.env.NODE_ENV !== 'development') return false

	const raw =
		(typeof req.headers['x-forwarded-host'] === 'string'
			? req.headers['x-forwarded-host']
			: '') ||
		(typeof req.headers.host === 'string' ? req.headers.host : '')

	const host = raw.split(',')[0].trim().toLowerCase()
	const hostname = host.replace(/:\d+$/, '')
	return (
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname === '[::1]' ||
		hostname === '::1'
	)
}
