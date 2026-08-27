/**
 * Login page purpose blurb — bilingual copy stored in Firestore `settings/login`.
 * Public read (login is unauthenticated); admin write from the dashboard.
 */

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'

export const LOGIN_BLURB_SETTINGS_COLLECTION = 'settings'
export const LOGIN_BLURB_SETTINGS_DOC_ID = 'login'

/** @type {{ en: string, es: string }} */
export const DEFAULT_LOGIN_BLURB = {
	en: 'Truth Sleuth helps people submit reports about local election information they think might be inaccurate and lets partner organizations review.',
	es: 'Truth Sleuth ayuda a las personas a enviar reportes sobre información electoral local que consideran inexacta y permite que las organizaciones asociadas los revisen.',
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeBlurbText(value) {
	return typeof value === 'string' ? value.trim() : ''
}

/**
 * Merges Firestore data with defaults. Empty stored strings fall back to defaults.
 *
 * @param {unknown} raw
 * @returns {{ en: string, es: string }}
 */
export function normalizeLoginBlurbConfig(raw) {
	const source =
		raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}

	const en = normalizeBlurbText(source.en)
	const es = normalizeBlurbText(source.es)

	return {
		en: en || DEFAULT_LOGIN_BLURB.en,
		es: es || DEFAULT_LOGIN_BLURB.es,
	}
}

/**
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<{ en: string, es: string }>}
 */
export async function getLoginBlurbConfig(db) {
	const ref = doc(db, LOGIN_BLURB_SETTINGS_COLLECTION, LOGIN_BLURB_SETTINGS_DOC_ID)
	const snap = await getDoc(ref)
	if (!snap.exists()) {
		return { ...DEFAULT_LOGIN_BLURB }
	}
	return normalizeLoginBlurbConfig(snap.data())
}

/**
 * Saves admin-edited blurbs. Trims whitespace; empty fields revert to defaults on read.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {{ en?: string, es?: string }} config
 * @returns {Promise<{ en: string, es: string }>}
 */
export async function saveLoginBlurbConfig(db, config) {
	const normalized = normalizeLoginBlurbConfig(config)
	const ref = doc(db, LOGIN_BLURB_SETTINGS_COLLECTION, LOGIN_BLURB_SETTINGS_DOC_ID)
	await setDoc(
		ref,
		{
			en: normalizeBlurbText(config?.en),
			es: normalizeBlurbText(config?.es),
			updatedAt: new Date().toISOString(),
		},
		{ merge: true },
	)
	return normalized
}

/**
 * Removes custom blurbs so the login page uses built-in defaults again.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<void>}
 */
export async function resetLoginBlurbConfig(db) {
	const ref = doc(db, LOGIN_BLURB_SETTINGS_COLLECTION, LOGIN_BLURB_SETTINGS_DOC_ID)
	await deleteDoc(ref)
}

/**
 * Resolves blurb text for a locale key.
 *
 * @param {{ en: string, es: string }} config
 * @param {string | undefined} locale
 * @returns {string}
 */
export function getLoginBlurbForLocale(config, locale) {
	return locale === 'es' ? config.es : config.en
}
