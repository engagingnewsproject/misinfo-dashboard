// Firebase Hosting and App Hosting strip every cookie except `__session`.
export const SESSION_COOKIE = '__session'
export const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000

export function sessionCookieHeader(value, { maxAgeMs, secure }) {
	const parts = [
		`${SESSION_COOKIE}=${value}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax',
		`Max-Age=${Math.floor(maxAgeMs / 1000)}`,
	]
	if (secure) {
		parts.push('Secure')
	}
	return parts.join('; ')
}

export function checkSessionRequest(req) {
	const { headers } = req
	// Behind the App Hosting proxy `host` is internal; the public host is forwarded.
	const host = headers['x-forwarded-host']?.split(',')[0].trim() || headers.host
	const origin = URL.canParse(headers.origin)
		? new URL(headers.origin).host
		: null
	if (!host || origin !== host) {
		return { ok: false, status: 403 }
	}
	const contentType = headers['content-type']
		?.split(';')[0]
		.trim()
		.toLowerCase()
	if (req.method === 'POST' && contentType !== 'application/json') {
		return { ok: false, status: 400 }
	}
	return { ok: true }
}
