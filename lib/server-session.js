import { adminAuth } from './firebase-admin'
import { SESSION_COOKIE } from './session'

// Server-only: lib/session.js is also bundled for the client and must not pull in firebase-admin.
export async function getSession(req) {
	const cookie = req.cookies?.[SESSION_COOKIE]
	if (!cookie) {
		return null
	}
	try {
		return await adminAuth.verifySessionCookie(cookie, true)
	} catch {
		return null
	}
}
