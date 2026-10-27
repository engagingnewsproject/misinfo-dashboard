/**
 * Shared appearance / UI theme defaults for the dashboard.
 * Stored in Firestore `settings/appearance` (signed-in read, admin write).
 *
 * Live and study deploys for a brand share one Firebase project, so reporting
 * flags are stored as `{ live, study }` and each site reads the matching key.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore'

export const APPEARANCE_SETTINGS_COLLECTION = 'settings'
export const APPEARANCE_SETTINGS_DOC_ID = 'appearance'

/** Tailwind red-50 / red-100 — matches previous hardcoded investigation row classes. */
export const DEFAULT_INVESTIGATION_ROW = {
	bg: '#fef2f2',
	hover: '#fee2e2',
}

/** @type {{ reportTable: { investigationRow: { bg: string, hover: string } }, reporting: { showReminderStep: { live: boolean, study: boolean } } }} */
export const DEFAULT_APPEARANCE_CONFIG = {
	reportTable: {
		investigationRow: { ...DEFAULT_INVESTIGATION_ROW },
	},
	reporting: {
		showReminderStep: {
			live: true,
			study: true,
		},
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
 * @param {unknown} value
 * @param {boolean} fallback
 * @returns {boolean}
 */
function normalizeBool(value, fallback) {
	if (typeof value === 'boolean') return value
	return fallback
}

/**
 * Merges raw Firestore data with defaults so missing fields are safe.
 *
 * @param {unknown} raw
 * @returns {{ reportTable: { investigationRow: { bg: string, hover: string } }, reporting: { showReminderStep: { live: boolean, study: boolean } } }}
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
	const reporting =
		source.reporting && typeof source.reporting === 'object'
			? /** @type {Record<string, unknown>} */ (source.reporting)
			: {}
	const showReminderStep =
		reporting.showReminderStep && typeof reporting.showReminderStep === 'object'
			? /** @type {Record<string, unknown>} */ (reporting.showReminderStep)
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
		reporting: {
			showReminderStep: {
				live: normalizeBool(
					showReminderStep.live,
					DEFAULT_APPEARANCE_CONFIG.reporting.showReminderStep.live,
				),
				study: normalizeBool(
					showReminderStep.study,
					DEFAULT_APPEARANCE_CONFIG.reporting.showReminderStep.study,
				),
			},
		},
	}
}

/**
 * Which Reminder-step flag this deploy should use.
 *
 * @param {{ reporting?: { showReminderStep?: { live?: boolean, study?: boolean } } } | null | undefined} config
 * @param {boolean} isStudyCopy
 * @returns {boolean}
 */
export function resolveShowReminderStep(config, isStudyCopy) {
	const normalized = normalizeAppearanceConfig(config ?? null)
	return isStudyCopy
		? normalized.reporting.showReminderStep.study
		: normalized.reporting.showReminderStep.live
}

/**
 * Deep-merges a partial update onto an existing normalized config.
 *
 * @param {ReturnType<typeof normalizeAppearanceConfig>} existing
 * @param {{ reportTable?: { investigationRow?: { bg?: string, hover?: string } }, reporting?: { showReminderStep?: { live?: boolean, study?: boolean } } }} partial
 * @returns {ReturnType<typeof normalizeAppearanceConfig>}
 */
export function mergeAppearanceConfig(existing, partial) {
	const next = {
		reportTable: {
			investigationRow: {
				...existing.reportTable.investigationRow,
				...(partial?.reportTable?.investigationRow || {}),
			},
		},
		reporting: {
			showReminderStep: {
				...existing.reporting.showReminderStep,
				...(partial?.reporting?.showReminderStep || {}),
			},
		},
	}
	return normalizeAppearanceConfig(next)
}

/**
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<ReturnType<typeof normalizeAppearanceConfig>>}
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
 * Saves appearance settings without wiping unrelated sections.
 * Reads the current doc, merges the partial update, then writes the full config.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {{ reportTable?: { investigationRow?: { bg?: string, hover?: string } }, reporting?: { showReminderStep?: { live?: boolean, study?: boolean } } }} config
 * @returns {Promise<ReturnType<typeof normalizeAppearanceConfig>>}
 */
export async function saveAppearanceConfig(db, config) {
	const existing = await getAppearanceConfig(db)
	const normalized = mergeAppearanceConfig(existing, config || {})
	const ref = doc(db, APPEARANCE_SETTINGS_COLLECTION, APPEARANCE_SETTINGS_DOC_ID)
	await setDoc(ref, normalized, { merge: true })
	return normalized
}
