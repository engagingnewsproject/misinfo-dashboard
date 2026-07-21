/**
 * Shared appearance / UI theme defaults for the dashboard.
 * Stored in Firestore `settings/appearance` (signed-in read, admin write).
 */

import { doc, getDoc, setDoc } from 'firebase/firestore'

export const APPEARANCE_SETTINGS_COLLECTION = 'settings'
export const APPEARANCE_SETTINGS_DOC_ID = 'appearance'

/** Tailwind red-50 / red-100 — matches previous hardcoded investigation row classes. */
export const DEFAULT_INVESTIGATION_ROW = {
	bg: '#fef2f2',
	hover: '#fee2e2',
}

/** @type {{ reportTable: { investigationRow: { bg: string, hover: string } } }} */
export const DEFAULT_APPEARANCE_CONFIG = {
	reportTable: {
		investigationRow: { ...DEFAULT_INVESTIGATION_ROW },
	},
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeHex(value) {
	if (typeof value !== 'string') return null
	const trimmed = value.trim()
	if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
		return trimmed.toLowerCase()
	}
	if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
		const [, r, g, b] = trimmed
		return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
	}
	return null
}

/**
 * Merges raw Firestore data with defaults so missing fields are safe.
 *
 * @param {unknown} raw
 * @returns {{ reportTable: { investigationRow: { bg: string, hover: string } } }}
 */
export function normalizeAppearanceConfig(raw) {
	const source =
		raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
	const reportTable =
		source.reportTable && typeof source.reportTable === 'object'
			? /** @type {Record<string, unknown>} */ (source.reportTable)
			: {}
	const investigationRow =
		reportTable.investigationRow && typeof reportTable.investigationRow === 'object'
			? /** @type {Record<string, unknown>} */ (reportTable.investigationRow)
			: {}

	return {
		reportTable: {
			investigationRow: {
				bg:
					normalizeHex(investigationRow.bg) ||
					DEFAULT_APPEARANCE_CONFIG.reportTable.investigationRow.bg,
				hover:
					normalizeHex(investigationRow.hover) ||
					DEFAULT_APPEARANCE_CONFIG.reportTable.investigationRow.hover,
			},
		},
	}
}

/**
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<{ reportTable: { investigationRow: { bg: string, hover: string } } }>}
 */
export async function getAppearanceConfig(db) {
	const ref = doc(db, APPEARANCE_SETTINGS_COLLECTION, APPEARANCE_SETTINGS_DOC_ID)
	const snap = await getDoc(ref)
	if (!snap.exists()) {
		return normalizeAppearanceConfig(null)
	}
	return normalizeAppearanceConfig(snap.data())
}

/**
 * @param {import('firebase/firestore').Firestore} db
 * @param {{ reportTable?: { investigationRow?: { bg?: string, hover?: string } } }} config
 * @returns {Promise<{ reportTable: { investigationRow: { bg: string, hover: string } } }>}
 */
export async function saveAppearanceConfig(db, config) {
	const normalized = normalizeAppearanceConfig(config)
	const ref = doc(db, APPEARANCE_SETTINGS_COLLECTION, APPEARANCE_SETTINGS_DOC_ID)
	await setDoc(ref, normalized, { merge: true })
	return normalized
}
