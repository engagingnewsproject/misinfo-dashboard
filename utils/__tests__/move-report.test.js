import {
	ROUTING_REASON_MOVED,
	agenciesForState,
	buildMovedReportUpdates,
} from '../move-report'

const AGENCIES = [
	{ id: 'test1', name: 'Test Agency', state: 'Texas' },
	{ id: 'wpsu', name: 'WPSU', state: 'Pennsylvania' },
	{ id: 'nao', name: 'News & Observer', state: 'North Carolina' },
	{ id: 'enlace', name: 'Enlace NC', state: 'north carolina' },
]

describe('agenciesForState', () => {
	it('matches state case-insensitively and sorts by name', () => {
		expect(agenciesForState(AGENCIES, 'North Carolina').map((a) => a.id)).toEqual([
			'enlace',
			'nao',
		])
	})

	it('puts the current agency first when it is in the state', () => {
		expect(
			agenciesForState(AGENCIES, 'North Carolina', 'nao').map((a) => a.id),
		).toEqual(['nao', 'enlace'])
	})

	it('returns nothing for blank or unknown states', () => {
		expect(agenciesForState(AGENCIES, '')).toEqual([])
		expect(agenciesForState(AGENCIES, 'Nevada')).toEqual([])
	})
})

describe('buildMovedReportUpdates', () => {
	const movedAt = new Date('2026-09-29T12:00:00Z')

	it('sets agency, state, and audit fields', () => {
		expect(
			buildMovedReportUpdates(AGENCIES[1], {
				uid: 'admin-1',
				fromAgency: 'Test Agency',
				movedAt,
			}),
		).toEqual({
			agency: 'WPSU',
			agencyId: 'wpsu',
			state: 'Pennsylvania',
			routingReason: ROUTING_REASON_MOVED,
			movedFromAgency: 'Test Agency',
			movedBy: 'admin-1',
			movedAt,
			read: false,
			label: '',
			note: '',
		})
	})

	it('does not touch report content fields', () => {
		const updates = buildMovedReportUpdates(AGENCIES[1], { uid: 'u', fromAgency: 'x' })
		for (const key of ['title', 'detail', 'link', 'createdDate', 'experimentId']) {
			expect(updates).not.toHaveProperty(key)
		}
	})

	it('throws without a target agency id', () => {
		expect(() => buildMovedReportUpdates({ name: 'X', state: 'Y' }, { uid: 'u' })).toThrow()
	})
})
