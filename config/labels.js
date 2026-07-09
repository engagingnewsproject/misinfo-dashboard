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

/** Legacy labels kept for display on existing reports. */
export const LEGACY_LABELS = [
	'Investigated: Flagged',
	'Investigated: Benign',
]

/** Default label set seeded for newly created agencies. */
export const DEFAULT_AGENCY_LABELS = [...APP_WIDE_LABELS]

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
 * Returns a badge class for a given label value.
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
