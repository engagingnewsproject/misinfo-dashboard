/**
 * @fileoverview Brand selection via NEXT_PUBLIC_BRAND and brand helpers.
 */

const ORIGINAL_ENV = {
	NEXT_PUBLIC_BRAND: process.env.NEXT_PUBLIC_BRAND,
	NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID: process.env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID,
	NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME: process.env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME,
}

function setEnv(key, value) {
	if (value === undefined) delete process.env[key]
	else process.env[key] = value
}

function loadBrand(value, { agencyId, agencyName } = {}) {
	setEnv('NEXT_PUBLIC_BRAND', value)
	setEnv('NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID', agencyId)
	setEnv('NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME', agencyName)
	let mod
	jest.isolateModules(() => {
		mod = require('../brand')
	})
	return mod
}

afterEach(() => {
	for (const [key, value] of Object.entries(ORIGINAL_ENV)) setEnv(key, value)
	jest.restoreAllMocks()
})

describe('brand selection', () => {
	it('defaults to misinfo when unset', () => {
		const { BRAND_ID, brand } = loadBrand(undefined)
		expect(BRAND_ID).toBe('misinfo')
		expect(brand.appName).toBe('Truth Sleuth Local')
	})

	it('falls back to misinfo for an unknown brand', () => {
		expect(loadBrand('nope').BRAND_ID).toBe('misinfo')
	})

	it('picks caffeine when NEXT_PUBLIC_BRAND=caffeine', () => {
		const { BRAND_ID, brand } = loadBrand('caffeine')
		expect(BRAND_ID).toBe('caffeine')
		expect(brand.appName).toBe('Caffeine Dashboard')
		expect(brand.firebaseProjectId).toBe('caffeine-app-d8cd8')
	})
})

describe('helpers', () => {
	it('tagDisplayName keeps Firestore keys for misinfo and renames Topic for caffeine', () => {
		expect(loadBrand('misinfo').tagDisplayName('Topic')).toBe('Topic')
		const caffeine = loadBrand('caffeine')
		expect(caffeine.tagDisplayName('Topic')).toBe('Product')
		expect(caffeine.tagDisplayName('Source')).toBe('Source')
	})

	it('isFeatureEnabled hides the pipeline admin for caffeine only', () => {
		expect(loadBrand('misinfo').isFeatureEnabled('pipelineAdmin')).toBe(true)
		expect(loadBrand('caffeine').isFeatureEnabled('pipelineAdmin')).toBe(false)
		expect(loadBrand('caffeine').isFeatureEnabled('experimentSettings')).toBe(false)
	})

	it('pageTitle appends the app name', () => {
		expect(loadBrand('misinfo').pageTitle('Login')).toBe('Login | Truth Sleuth Local')
		expect(loadBrand('caffeine').pageTitle('Login')).toBe('Login | Caffeine Dashboard')
		expect(loadBrand('caffeine').pageTitle('')).toBe('Caffeine Dashboard')
	})

	it('every brand keeps the To Investigate and Other labels the code relies on', () => {
		const { BRANDS } = loadBrand(undefined)
		for (const b of Object.values(BRANDS)) {
			const names = b.appWideLabels.map(({ name }) => name)
			expect(names).toContain('To Investigate')
			expect(names).toContain('Other')
		}
		expect(BRANDS.caffeine.appWideLabels.map(({ name }) => name)).toEqual([
			'To Investigate',
			'Flagged',
			'Not Flagged',
			'Other',
		])
	})

	it('only caffeine sends every report to a fixed agency', () => {
		const { BRANDS } = loadBrand(undefined)
		expect(BRANDS.misinfo.fixedReportAgency).toBeNull()
		expect(BRANDS.caffeine.fixedReportAgency).toEqual({
			id: 'i2ef53bVPh9xciy0huIR',
			name: 'Test Agency',
		})
	})

	it('keeps the brand default fixed agency when no override is set', () => {
		expect(loadBrand('misinfo').brand.fixedReportAgency).toBeNull()
		expect(loadBrand('caffeine').brand.fixedReportAgency).toEqual({
			id: 'i2ef53bVPh9xciy0huIR',
			name: 'Test Agency',
		})
	})

	it('lets a deploy send every report to one agency (online study copies)', () => {
		const study = { agencyId: ' prolific123 ', agencyName: 'Prolific sample' }
		const expected = { id: 'prolific123', name: 'Prolific sample' }
		expect(loadBrand('misinfo', study).brand.fixedReportAgency).toEqual(expected)
		expect(loadBrand('caffeine', study).brand.fixedReportAgency).toEqual(expected)
	})

	it('does not change the shared brand configs when overridden', () => {
		const { BRANDS } = loadBrand('misinfo', { agencyId: 'p1', agencyName: 'Prolific sample' })
		expect(BRANDS.misinfo.fixedReportAgency).toBeNull()
	})

	it('ignores a half-set override and warns', () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
		expect(loadBrand('misinfo', { agencyId: 'p1' }).brand.fixedReportAgency).toBeNull()
		expect(
			loadBrand('caffeine', { agencyName: 'Prolific sample' }).brand.fixedReportAgency,
		).toEqual({ id: 'i2ef53bVPh9xciy0huIR', name: 'Test Agency' })
		expect(warn).toHaveBeenCalledTimes(2)
	})

	it('tags new users with the site they signed up on', () => {
		const study = { agencyId: 'p1', agencyName: 'Prolific sample' }
		expect(loadBrand('misinfo').brand.signupSource).toBe('truthsleuth')
		expect(loadBrand('caffeine').brand.signupSource).toBe('caffeine')
		expect(loadBrand('misinfo', study).brand.signupSource).toBe('truthsleuth-study')
		expect(loadBrand('caffeine', study).brand.signupSource).toBe('caffeine-study')
	})

	it('does not treat a half-set agency override as a study copy', () => {
		jest.spyOn(console, 'warn').mockImplementation(() => {})
		expect(loadBrand('misinfo', { agencyId: 'p1' }).brand.signupSource).toBe('truthsleuth')
		expect(loadBrand('caffeine', { agencyName: 'Prolific sample' }).brand.signupSource).toBe(
			'caffeine',
		)
	})

	it('every brand defines the same top-level keys', () => {
		const { BRANDS } = loadBrand(undefined)
		const keys = Object.keys(BRANDS.misinfo).sort()
		for (const b of Object.values(BRANDS)) {
			expect(Object.keys(b).sort()).toEqual(keys)
		}
	})
})
