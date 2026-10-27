import {
	DEFAULT_APPEARANCE_CONFIG,
	normalizeAppearanceConfig,
	resolveShowReminderStep,
} from '../appearance-config'

describe('normalizeAppearanceConfig', () => {
	it('returns defaults when raw is empty', () => {
		expect(normalizeAppearanceConfig(null)).toEqual(DEFAULT_APPEARANCE_CONFIG)
		expect(normalizeAppearanceConfig({})).toEqual(DEFAULT_APPEARANCE_CONFIG)
	})

	it('keeps investigation row colors and reminder flags when present', () => {
		expect(
			normalizeAppearanceConfig({
				reportTable: {
					investigationRow: { bg: '#112233', hover: '#445566' },
				},
				reporting: {
					showReminderStep: { live: false, study: true },
				},
			}),
		).toEqual({
			reportTable: {
				investigationRow: { bg: '#112233', hover: '#445566' },
			},
			reporting: {
				showReminderStep: { live: false, study: true },
			},
		})
	})

	it('fills missing reporting flags with defaults without wiping colors', () => {
		expect(
			normalizeAppearanceConfig({
				reportTable: {
					investigationRow: { bg: '#aabbcc', hover: '#ddeeff' },
				},
			}),
		).toEqual({
			reportTable: {
				investigationRow: { bg: '#aabbcc', hover: '#ddeeff' },
			},
			reporting: {
				showReminderStep: { live: true, study: true },
			},
		})
	})

	it('coerces non-boolean reminder flags to defaults', () => {
		expect(
			normalizeAppearanceConfig({
				reporting: {
					showReminderStep: { live: 'yes', study: 1 },
				},
			}).reporting.showReminderStep,
		).toEqual({ live: true, study: true })
	})
})

describe('resolveShowReminderStep', () => {
	it('defaults live and study on', () => {
		expect(resolveShowReminderStep(null, false)).toBe(true)
		expect(resolveShowReminderStep(null, true)).toBe(true)
		expect(resolveShowReminderStep(DEFAULT_APPEARANCE_CONFIG, false)).toBe(true)
		expect(resolveShowReminderStep(DEFAULT_APPEARANCE_CONFIG, true)).toBe(true)
	})

	it('reads the live or study flag for this deploy', () => {
		const config = {
			reporting: {
				showReminderStep: { live: false, study: true },
			},
		}
		expect(resolveShowReminderStep(config, false)).toBe(false)
		expect(resolveShowReminderStep(config, true)).toBe(true)
	})
})
