/**
 * Shared helpers for `mobileUsers/{uid}` documents.
 * Document ID must always be the Firebase Auth UID (never email).
 * Shape matches community / agency signup in `pages/signup.jsx`.
 */

/** @typedef {'User' | 'Agency' | 'Admin'} MobileUserRole */

/**
 * @typedef {Object} MobileUserProfileInput
 * @property {string} [name]
 * @property {string} [email]
 * @property {number} [joiningDate] Unix seconds; defaults to now
 * @property {unknown} [state]
 * @property {unknown} [city]
 * @property {boolean} [isBanned]
 * @property {MobileUserRole | string} [userRole]
 * @property {boolean} [contact]
 * @property {string} [agency]
 */

/**
 * Builds a Firestore payload for recreating a missing mobileUsers doc.
 *
 * @param {MobileUserProfileInput} input
 * @returns {Record<string, unknown>}
 */
export function buildMobileUserProfile(input = {}) {
	const profile = {
		name: typeof input.name === 'string' ? input.name : '',
		email: typeof input.email === 'string' ? input.email : '',
		joiningDate:
			typeof input.joiningDate === 'number' && Number.isFinite(input.joiningDate)
				? input.joiningDate
				: Math.floor(Date.now() / 1000),
		state: input.state ?? '',
		city: input.city ?? '',
		isBanned: Boolean(input.isBanned),
		userRole: input.userRole || 'User',
		contact: Boolean(input.contact),
	}

	if (typeof input.agency === 'string' && input.agency.trim() !== '') {
		profile.agency = input.agency.trim()
	}

	return profile
}

/**
 * Maps Auth custom claims to the mobileUsers `userRole` string.
 *
 * @param {Record<string, unknown> | null | undefined} customClaims
 * @returns {MobileUserRole}
 */
export function userRoleFromClaims(customClaims) {
	if (!customClaims || typeof customClaims !== 'object') {
		return 'User'
	}
	if (customClaims.admin === true) {
		return 'Admin'
	}
	if (customClaims.agency === true) {
		return 'Agency'
	}
	return 'User'
}

/**
 * Prefer Auth displayName; otherwise derive a short label from email.
 *
 * @param {{ displayName?: string | null, email?: string | null }} authUser
 * @returns {string}
 */
export function defaultDisplayNameFromAuth(authUser) {
	const displayName =
		typeof authUser?.displayName === 'string' ? authUser.displayName.trim() : ''
	if (displayName) {
		return displayName
	}
	const email = typeof authUser?.email === 'string' ? authUser.email.trim() : ''
	if (email.includes('@')) {
		return email.split('@')[0] || email
	}
	return email || 'Restored user'
}
