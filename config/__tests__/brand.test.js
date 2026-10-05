/**
 * @fileoverview Brand selection via NEXT_PUBLIC_BRAND and brand helpers.
 */

const ORIGINAL_BRAND = process.env.NEXT_PUBLIC_BRAND

function loadBrand(value) {
	if (value === undefined) delete process.env.NEXT_PUBLIC_BRAND
	else process.env.NEXT_PUBLIC_BRAND = value
	let mod
	jest.isolateModules(() => {
		mod = require('../brand')
	})
	return mod
}

afterEach(() => {
	if (ORIGINAL_BRAND === undefined) delete process.env.NEXT_PUBLIC_BRAND
	else process.env.NEXT_PUBLIC_BRAND = ORIGINAL_BRAND
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
		expect(brand.appName).toBe('Caffeine App')
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
		expect(loadBrand('caffeine').pageTitle('Login')).toBe('Login | Caffeine App')
		expect(loadBrand('caffeine').pageTitle('')).toBe('Caffeine App')
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

	it('every brand defines the same top-level keys', () => {
		const { BRANDS } = loadBrand(undefined)
		const keys = Object.keys(BRANDS.misinfo).sort()
		for (const b of Object.values(BRANDS)) {
			expect(Object.keys(b).sort()).toEqual(keys)
		}
	})
})
