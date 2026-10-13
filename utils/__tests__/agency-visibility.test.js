import { isPickableAgency } from '../agency-visibility'

describe('isPickableAgency', () => {
	it('allows normal newsrooms', () => {
		expect(isPickableAgency({ name: 'WPSU', state: 'Pennsylvania' })).toBe(true)
		expect(isPickableAgency({ name: 'WPSU', hiddenFromPicker: false })).toBe(true)
	})

	it('hides agencies flagged hiddenFromPicker (e.g. Prolific sample)', () => {
		expect(isPickableAgency({ name: 'Prolific sample', hiddenFromPicker: true })).toBe(false)
	})

	it('rejects missing data', () => {
		expect(isPickableAgency(null)).toBe(false)
		expect(isPickableAgency(undefined)).toBe(false)
	})
})
