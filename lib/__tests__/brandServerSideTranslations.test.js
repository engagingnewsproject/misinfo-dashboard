/**
 * @fileoverview Brand wording overrides merged into next-i18next translations.
 */

jest.mock('next-i18next/serverSideTranslations', () => ({
	serverSideTranslations: jest.fn(),
}))

import {
	applyBrandOverrides,
	deepMerge,
} from '../brandServerSideTranslations'
import brandLocaleOverrides from '../brand-locale-overrides'

describe('deepMerge', () => {
	it('merges nested objects and replaces leaf values', () => {
		expect(
			deepMerge(
				{ a: 'x', topics: { Health: 'Health', Other: 'Other' } },
				{ a: 'y', topics: { Soda: 'Soda' } },
			),
		).toEqual({ a: 'y', topics: { Health: 'Health', Other: 'Other', Soda: 'Soda' } })
	})
})

describe('applyBrandOverrides', () => {
	const store = {
		en: { NewReport: { topic: 'Topic', review: 'Review' }, Navbar: { home: 'Home' } },
		es: { NewReport: { topic: 'Tema' } },
	}

	it('only touches namespaces that were loaded', () => {
		const out = applyBrandOverrides(store, brandLocaleOverrides.caffeine)
		expect(out.en.NewReport.topic).toBe('Product')
		expect(out.en.NewReport.review).toBe('Review')
		expect(out.en.Navbar).toEqual({ home: 'Home' })
		expect(out.en.Welcome).toBeUndefined()
		expect(out.es.NewReport.topic).toBe('Producto')
	})

	it('leaves the store alone for brands without overrides', () => {
		expect(applyBrandOverrides(store, brandLocaleOverrides.misinfo)).toEqual(store)
	})

	it('does not mutate the input store', () => {
		applyBrandOverrides(store, brandLocaleOverrides.caffeine)
		expect(store.en.NewReport.topic).toBe('Topic')
	})
})

describe('caffeine override files', () => {
	const en = require('../../public/locales/en/NewReport.json')

	it('only override keys that exist in the base English files', () => {
		for (const [ns, overrides] of Object.entries(brandLocaleOverrides.caffeine.en)) {
			const base = require(`../../public/locales/en/${ns}.json`)
			for (const key of Object.keys(overrides)) {
				expect(base).toHaveProperty([key])
			}
		}
		expect(en.topic).toBe('Topic')
	})
})
