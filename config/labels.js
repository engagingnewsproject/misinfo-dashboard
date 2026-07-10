/**
 * Shared label constants and helpers for report labeling.
 * App-wide defaults are fixed; agencies may add custom labels via the Other flow.
 */

export const APP_WIDE_LABELS = [
	'To Investigate',
	'Misinfo',
	'Not Misinfo',
	'Other',
]

export const DEFAULT_REPORT_LABEL = 'To Investigate'
export const OTHER_LABEL = 'Other'
export const CUSTOM_LABEL_MAX_LENGTH = 40
export const MAX_CUSTOM_LABELS = 6

/** Flip to 'admin' if project lead requests admin-only label management. */
export const LABEL_MANAGER_ROLE = 'agency'

export const DEFAULT_LABEL_COLORS = {
	'To Investigate': '#facc15',
	Misinfo: '#ef4444',
	'Not Misinfo': '#22c55e',
	Other: '#9ca3af',
}

export const CUSTOM_LABEL_DEFAULT_COLOR = '#9ca3af'

const LEGACY_LABEL_COLORS = {
	'Investigated: Flagged': '#fed7aa',
}

/** Legacy labels kept for display on existing reports. */
export const LEGACY_LABELS = [
	'Investigated: Flagged',
	'Investigated: Benign',
]

/** Default label set seeded for newly created agencies. */
export const DEFAULT_AGENCY_LABELS = [...APP_WIDE_LABELS]

/**
 * Whether the current user can access the Labels editor in Tagging Systems.
 *
 * @param {{ admin?: boolean, agency?: boolean }} [customClaims]
 * @returns {boolean}
 */
export function canManageAgencyLabels(customClaims) {
	return LABEL_MANAGER_ROLE === 'admin'
		? Boolean(customClaims?.admin)
		: Boolean(customClaims?.agency)
}

/**
 * @param {string} [label]
 * @returns {boolean}
 */
export function isAppWideLabel(label) {
	return APP_WIDE_LABELS.includes(label)
}

/**
 * @param {string} [label]
 * @returns {boolean}
 */
export function isCustomLabel(label) {
	return Boolean(label) && !isAppWideLabel(label)
}

/**
 * Merges app-wide labels, agency customs, and the report's current label (if legacy).
 *
 * @param {string[]} [agencyActiveLabels]
 * @param {string} [currentLabel]
 * @returns {string[]}
 */
export function buildLabelOptions(agencyActiveLabels = [], currentLabel = '') {
	const agencyCustom = (agencyActiveLabels || []).filter(
		(label) => !APP_WIDE_LABELS.includes(label),
	)
	const options = [...APP_WIDE_LABELS, ...agencyCustom]

	if (currentLabel && !options.includes(currentLabel)) {
		options.push(currentLabel)
	}

	return [...new Set(options)]
}

/**
 * Returns the label text shown in the UI.
 *
 * @param {string} [label]
 * @returns {string}
 */
export function displayLabel(label) {
	return label || DEFAULT_REPORT_LABEL
}

/**
 * Whether a report still needs investigation (yellow badge).
 *
 * @param {string} [label]
 * @returns {boolean}
 */
export function isInvestigationPending(label) {
	return !label || label === DEFAULT_REPORT_LABEL
}

/**
 * Resolves the display color for a label (hex).
 *
 * @param {string} [label]
 * @param {Record<string, string>} [agencyColors]
 * @returns {string}
 */
export function getLabelColor(label, agencyColors = {}) {
	const actualLabel = label || DEFAULT_REPORT_LABEL

	if (DEFAULT_LABEL_COLORS[actualLabel]) {
		return DEFAULT_LABEL_COLORS[actualLabel]
	}

	if (LEGACY_LABEL_COLORS[actualLabel]) {
		return LEGACY_LABEL_COLORS[actualLabel]
	}

	if (agencyColors[actualLabel]) {
		return agencyColors[actualLabel]
	}

	if (isCustomLabel(actualLabel)) {
		return CUSTOM_LABEL_DEFAULT_COLOR
	}

	return CUSTOM_LABEL_DEFAULT_COLOR
}

/**
 * Returns contrasting text color for a label badge background.
 *
 * @param {string} backgroundHex
 * @returns {string}
 */
export function getLabelTextColor(backgroundHex) {
	const hex = backgroundHex.replace('#', '')
	if (hex.length !== 6) return '#1f2937'

	const r = parseInt(hex.slice(0, 2), 16)
	const g = parseInt(hex.slice(2, 4), 16)
	const b = parseInt(hex.slice(4, 6), 16)
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

	return luminance > 0.6 ? '#1f2937' : '#ffffff'
}

/**
 * Returns inline badge styles for a label.
 *
 * @param {string} [label]
 * @param {Record<string, string>} [agencyColors]
 * @returns {{ backgroundColor: string, color: string }}
 */
export function getLabelBadgeStyle(label, agencyColors = {}) {
	const backgroundColor = getLabelColor(label, agencyColors)
	return {
		backgroundColor,
		color: getLabelTextColor(backgroundColor),
	}
}

/**
 * Returns a badge class for a given label value (legacy fallback).
 *
 * @param {string} [label]
 * @returns {string}
 */
export function getLabelBadgeClass(label) {
	if (isInvestigationPending(label)) {
		return 'bg-yellow-400'
	}
	if (label === 'Investigated: Flagged') {
		return 'bg-orange-200'
	}
	return ''
}

/**
 * Validates custom label text entered via the Other flow.
 * Returns an error message string, or null if valid.
 *
 * @param {string} text
 * @returns {string|null}
 */
export function validateCustomLabel(text) {
	const trimmed = (text || '').trim()

	if (!trimmed) {
		return 'Please enter a label.'
	}

	if (trimmed.length > CUSTOM_LABEL_MAX_LENGTH) {
		return `Label must be ${CUSTOM_LABEL_MAX_LENGTH} characters or fewer.`
	}

	const lower = trimmed.toLowerCase()
	if (APP_WIDE_LABELS.some((l) => l.toLowerCase() === lower)) {
		return 'Please choose that option from the dropdown instead.'
	}

	return null
}
