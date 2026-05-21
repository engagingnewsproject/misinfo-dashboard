/**
 * Shared experiment cohort defaults used by the dashboard and Cloud Functions.
 * Keep in sync with functions/experiment-config.js.
 */

export const EXPERIMENT_SETTINGS_COLLECTION = 'settings'
export const EXPERIMENT_SETTINGS_DOC_ID = 'experiment'

/** @type {{ activeExperimentId: string, experiments: Array<{ id: string, label: string }> }} */
export const DEFAULT_EXPERIMENT_CONFIG = {
	activeExperimentId: '2026-main',
	experiments: [
		{ id: '2024-pilot', label: '2024 study' },
		{ id: '2025-main', label: '2025 study' },
		{ id: '2026-main', label: '2026 study' },
	],
}

/** Oldest-first: first matching cutoff wins on backfill. */
export const EXPERIMENT_COHORT_CUTOFFS = [
	{
		beforeMs: Date.parse('2025-01-01T00:00:00.000Z'),
		experimentId: '2024-pilot',
	},
	{
		beforeMs: Date.parse('2026-01-01T00:00:00.000Z'),
		experimentId: '2025-main',
	},
]

/** Default bulk-archive cutoff (reports with createdDate before this are archived). */
export const DEFAULT_ARCHIVE_CUTOFF_ISO = '2026-01-01T00:00:00.000Z'

/** @deprecated Use DEFAULT_ARCHIVE_CUTOFF_ISO */
export const LEGACY_EXPERIMENT_CUTOFF_ISO = DEFAULT_ARCHIVE_CUTOFF_ISO

/**
 * @param {import('firebase/firestore').Timestamp | Date | undefined} createdDate
 * @param {string} activeExperimentId
 * @returns {string}
 */
export function inferExperimentIdFromCreatedDate(createdDate, activeExperimentId) {
	if (!createdDate) {
		return activeExperimentId
	}
	const date =
		typeof createdDate.toDate === 'function'
			? createdDate.toDate()
			: new Date(createdDate)
	const ms = date.getTime()
	if (Number.isNaN(ms)) {
		return activeExperimentId
	}
	for (const tier of EXPERIMENT_COHORT_CUTOFFS) {
		if (ms < tier.beforeMs) {
			return tier.experimentId
		}
	}
	return activeExperimentId
}
