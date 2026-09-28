// Mirrors the reports read rule in firestore.rules (the Admin SDK bypasses rules).
// Keep in sync; `npm run test:rules-parity` checks it against the real rules.
export function canReadReport(claims, report) {
	if (!claims || !report) {
		return false
	}

	if (claims.admin === true) {
		return true
	}

	const isAgencyUser =
		claims.agency === true &&
		typeof claims.agencyId === 'string' &&
		claims.agencyId.length > 0
	if (isAgencyUser && report.agencyId === claims.agencyId) {
		return true
	}

	return (
		typeof claims.uid === 'string' &&
		claims.uid.length > 0 &&
		report.userID === claims.uid
	)
}
