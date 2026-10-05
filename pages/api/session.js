import { adminAuth } from '../../lib/firebase-admin'
import {
	SESSION_MAX_AGE_MS,
	checkSessionRequest,
	sessionCookieHeader,
} from '../../lib/session'

export default async function handler(req, res) {
	if (req.method !== 'POST' && req.method !== 'DELETE') {
		res.setHeader('Allow', 'POST, DELETE')
		res.status(405).end()
		return
	}

	res.setHeader('Cache-Control', 'no-store')

	const check = checkSessionRequest(req)
	if (!check.ok) {
		res.status(check.status).end()
		return
	}

	const secure = process.env.NODE_ENV === 'production'

	if (req.method === 'DELETE') {
		res.setHeader(
			'Set-Cookie',
			sessionCookieHeader('', { maxAgeMs: 0, secure }),
		)
		res.status(204).end()
		return
	}

	const idToken = req.body?.idToken
	if (typeof idToken !== 'string' || !idToken) {
		res.status(400).end()
		return
	}

	try {
		await adminAuth.verifyIdToken(idToken, true)
	} catch {
		res.status(401).end()
		return
	}

	const cookie = await adminAuth.createSessionCookie(idToken, {
		expiresIn: SESSION_MAX_AGE_MS,
	})
	res.setHeader(
		'Set-Cookie',
		sessionCookieHeader(cookie, { maxAgeMs: SESSION_MAX_AGE_MS, secure }),
	)
	res.status(204).end()
}
