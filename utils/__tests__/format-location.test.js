import {
	formatLocationPart,
	formatCityState,
	formatReportLocation,
} from '../format-location'

describe('formatLocationPart', () => {
	it('returns trimmed strings and numbers', () => {
		expect(formatLocationPart('  Austin  ')).toBe('Austin')
		expect(formatLocationPart(42)).toBe('42')
	})

	it('reads preferred keys from objects', () => {
		expect(formatLocationPart({ name: 'Austin' })).toBe('Austin')
		expect(formatLocationPart({ code: 'TX' })).toBe('TX')
	})

	it('returns empty for null, empty string, and N/A', () => {
		expect(formatLocationPart(null)).toBe('')
		expect(formatLocationPart('')).toBe('')
		expect(formatLocationPart('N/A')).toBe('')
	})
})

describe('formatCityState', () => {
	it('joins city and state when both exist', () => {
		expect(formatCityState('Austin', 'TX')).toBe('Austin, TX')
	})

	it('returns a single part when the other is missing', () => {
		expect(formatCityState('Austin', null)).toBe('Austin')
		expect(formatCityState('', 'TX')).toBe('TX')
	})
})

describe('formatReportLocation', () => {
	it('prefers report location over submitter', () => {
		expect(
			formatReportLocation(
				{ city: 'Austin', state: 'TX' },
				{ city: 'Dallas', state: 'TX' },
			),
		).toBe('Austin, TX')
	})

	it('falls back to submitter when report has no location', () => {
		expect(
			formatReportLocation({}, { city: 'Dallas', state: 'TX' }),
		).toBe('Dallas, TX')
	})
})
