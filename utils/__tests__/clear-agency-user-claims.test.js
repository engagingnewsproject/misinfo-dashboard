import { clearAgencyUserClaims } from '../clear-agency-user-claims'

describe('clearAgencyUserClaims', () => {
	it('clears claims for every email', async () => {
		const resetUserRole = jest.fn().mockResolvedValue({})

		await expect(
			clearAgencyUserClaims(
				['one@example.com', 'two@example.com'],
				resetUserRole,
			),
		).resolves.toEqual([])
		expect(resetUserRole).toHaveBeenCalledTimes(2)
		expect(resetUserRole).toHaveBeenNthCalledWith(1, {
			email: 'one@example.com',
		})
		expect(resetUserRole).toHaveBeenNthCalledWith(2, {
			email: 'two@example.com',
		})
	})

	it('reports failures without stopping cleanup for other users', async () => {
		const missingUser = new Error('Auth user not found')
		const resetUserRole = jest
			.fn()
			.mockRejectedValueOnce(missingUser)
			.mockResolvedValueOnce({})

		await expect(
			clearAgencyUserClaims(
				['missing@example.com', 'existing@example.com'],
				resetUserRole,
			),
		).resolves.toEqual([{ email: 'missing@example.com', error: missingUser }])
		expect(resetUserRole).toHaveBeenCalledTimes(2)
	})
})
