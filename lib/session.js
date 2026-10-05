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

const NO_CLAIMS = {
	admin: false,
	agency: false,
	agencyId: null,
	agencyName: null,
}

export function normalizeCustomClaims(claims) {
	if (claims?.admin) {
		return { ...NO_CLAIMS, admin: true }
	}
	if (claims?.agency) {
		return {
			...NO_CLAIMS,
			agency: true,
			agencyId:
				typeof claims.agencyId === 'string' && claims.agencyId
					? claims.agencyId
					: null,
			agencyName:
				typeof claims.agencyName === 'string' && claims.agencyName
					? claims.agencyName
					: null,
		}
	}
	return { ...NO_CLAIMS }
}

export function toInitialAuth(claims) {
	return {
		user: {
			uid: claims.uid,
			accountId: claims.uid,
			email: claims.email ?? null,
			displayName: claims.name ?? null,
		},
		claims: normalizeCustomClaims(claims),
	}
}

export function initialAuthState(initialAuth) {
	if (initialAuth) {
		return {
			user: initialAuth.user,
			loading: false,
			claimsReady: true,
			customClaims: initialAuth.claims,
		}
	}
	return {
		user: null,
		loading: true,
		claimsReady: false,
		customClaims: normalizeCustomClaims(null),
	}
}

// Only same-site paths; `//host`, `/\host` and control characters can all escape to another origin.
export function safeNextPath(next) {
	if (
		typeof next !== 'string' ||
		!next.startsWith('/') ||
		next.startsWith('//') ||
		/[\\\u0000-\u001f]/.test(next)
	) {
		return null
	}
	return next
}
