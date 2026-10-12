/**
 * Loads translations like next-i18next's `serverSideTranslations`, then swaps in the active brand's
 * wording (e.g. Caffeine's "Product" instead of "Topic"). Use it in getStaticProps / getServerSideProps.
 *
 * Overrides deep-merge into whatever languages and namespaces next-i18next already loaded.
 */
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { BRAND_ID } from '../config/brand'
import brandLocaleOverrides from './brand-locale-overrides'

function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * @param {Record<string, unknown>} base
 * @param {Record<string, unknown>} override
 * @returns {Record<string, unknown>}
 */
export function deepMerge(base, override) {
	const out = { ...base }
	for (const [key, value] of Object.entries(override || {})) {
		out[key] =
			isPlainObject(value) && isPlainObject(out[key])
				? deepMerge(out[key], value)
				: value
	}
	return out
}

/**
 * Applies brand overrides to a next-i18next initial store ({ [lng]: { [ns]: {...} } }).
 *
 * @param {Record<string, Record<string, object>>} store
 * @param {Record<string, Record<string, object>>} overrides
 * @returns {Record<string, Record<string, object>>}
 */
export function applyBrandOverrides(store, overrides) {
	if (!store || !overrides) return store
	const out = { ...store }
	for (const [lng, namespaces] of Object.entries(out)) {
		const lngOverrides = overrides[lng]
		if (!lngOverrides) continue
		const merged = { ...namespaces }
		for (const ns of Object.keys(merged)) {
			if (lngOverrides[ns]) merged[ns] = deepMerge(merged[ns], lngOverrides[ns])
		}
		out[lng] = merged
	}
	return out
}

/**
 * Drop-in replacement for `serverSideTranslations`.
 *
 * @param {string} locale
 * @param {string[]} [namespaces]
 * @returns {Promise<object>}
 */
export async function brandServerSideTranslations(locale, namespaces) {
	const props = await serverSideTranslations(locale, namespaces)
	const overrides = brandLocaleOverrides[BRAND_ID]
	if (!overrides || !props?._nextI18Next?.initialI18nStore) return props
	return {
		...props,
		_nextI18Next: {
			...props._nextI18Next,
			initialI18nStore: applyBrandOverrides(props._nextI18Next.initialI18nStore, overrides),
		},
	}
}
