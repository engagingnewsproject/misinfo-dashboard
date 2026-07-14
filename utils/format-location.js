/**
 * Turns city/state values into readable text for the UI.
 * Report fields may be plain strings or objects like `{ name: "Austin" }`
 * from country-state-city / mobile user profiles.
 */

/**
 * Extracts a display string from a location field.
 *
 * @param {unknown} value - String, object with a name/code, or empty
 * @param {string[]} [preferenceKeys] - Object keys to prefer, in order
 * @returns {string} Human-readable location part, or empty string
 */
export function formatLocationPart(
	value,
	preferenceKeys = ['name', 'city', 'state', 'code', 'abbr', 'abbreviation', 'label', 'text', 'value'],
) {
	if (value == null || value === '') return ''
	if (typeof value === 'string' || typeof value === 'number') {
		const text = String(value).trim()
		return text === 'N/A' ? '' : text
	}
	if (typeof value === 'object' && !Array.isArray(value)) {
		for (const key of preferenceKeys) {
			if (typeof value[key] === 'string' && value[key].trim()) {
				return value[key].trim()
			}
		}
	}
	return ''
}

/**
 * Builds a "City, State" label from two location fields.
 *
 * @param {unknown} city
 * @param {unknown} state
 * @returns {string} Joined location, or empty string when both are missing
 */
export function formatCityState(city, state) {
	return [formatLocationPart(city), formatLocationPart(state)]
		.filter(Boolean)
		.join(', ')
}

/**
 * Prefers the report's own city/state; falls back to the submitter profile.
 *
 * @param {Object|null|undefined} report - Report document fields
 * @param {Object|null|undefined} submitter - mobileUsers (or similar) profile
 * @returns {string} Display location for the report modal / details view
 */
export function formatReportLocation(report, submitter) {
	const fromReport = formatCityState(report?.city, report?.state)
	if (fromReport) return fromReport
	return formatCityState(submitter?.city, submitter?.state)
}
