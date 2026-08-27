import {
	DEFAULT_LOGIN_BLURB,
	getLoginBlurbForLocale,
	normalizeLoginBlurbConfig,
} from '../login-blurb-config'

describe('normalizeLoginBlurbConfig', () => {
	it('returns defaults when raw is empty', () => {
		expect(normalizeLoginBlurbConfig(null)).toEqual(DEFAULT_LOGIN_BLURB)
		expect(normalizeLoginBlurbConfig({})).toEqual(DEFAULT_LOGIN_BLURB)
	})

	it('trims stored blurbs and keeps both locales', () => {
		expect(
			normalizeLoginBlurbConfig({
				en: '  Custom English  ',
				es: '  Custom Spanish  ',
			}),
		).toEqual({
			en: 'Custom English',
			es: 'Custom Spanish',
		})
	})

	it('falls back per locale when a stored value is blank', () => {
		expect(normalizeLoginBlurbConfig({ en: 'Only EN', es: '   ' })).toEqual({
			en: 'Only EN',
			es: DEFAULT_LOGIN_BLURB.es,
		})
	})
})

describe('getLoginBlurbForLocale', () => {
	const config = { en: 'English text', es: 'Spanish text' }

	it('returns Spanish for es locale', () => {
		expect(getLoginBlurbForLocale(config, 'es')).toBe('Spanish text')
	})

	it('returns English for en and unknown locales', () => {
		expect(getLoginBlurbForLocale(config, 'en')).toBe('English text')
		expect(getLoginBlurbForLocale(config, undefined)).toBe('English text')
	})
})
