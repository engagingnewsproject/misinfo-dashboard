/**
 * Clears Auth claims for every agency email without letting one failure stop
 * the remaining users.
 *
 * @param {string[]} emails
 * @param {(data: {email: string}) => Promise<unknown>} resetUserRole
 * @returns {Promise<Array<{email: string, error: unknown}>>}
 */
export async function clearAgencyUserClaims(emails, resetUserRole) {
	const results = await Promise.allSettled(
		emails.map((email) => resetUserRole({ email })),
	)

	return results.flatMap((result, index) =>
		result.status === 'rejected'
			? [{ email: emails[index], error: result.reason }]
			: [],
	)
}
