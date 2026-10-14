/**
 * Which agencies reporters and admin routing tools can choose.
 *
 * Some agencies only exist to collect reports from a separate deploy (e.g. the
 * "Prolific sample" agency behind the online study copies). They still need a
 * state for the admin form, so they set `hiddenFromPicker: true` to stay out of
 * the live app's "pick an agency" step and state-based moves.
 */

/**
 * @param {Record<string, unknown> | null | undefined} agencyData - Agency doc data
 * @returns {boolean}
 */
export function isPickableAgency(agencyData) {
	return Boolean(agencyData) && agencyData.hiddenFromPicker !== true
}
