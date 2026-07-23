/**
 * Central Firestore query helpers for reports scoped to the active experiment cohort.
 */

import {
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	where,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import {
	DEFAULT_EXPERIMENT_CONFIG,
	EXPERIMENT_SETTINGS_COLLECTION,
	EXPERIMENT_SETTINGS_DOC_ID,
} from './experiment-config'

let cachedConfig = null

/**
 * @returns {Promise<typeof DEFAULT_EXPERIMENT_CONFIG>}
 */
export async function fetchExperimentConfig(forceRefresh = false) {
	if (cachedConfig && !forceRefresh) {
		return cachedConfig
	}
	const ref = doc(db, EXPERIMENT_SETTINGS_COLLECTION, EXPERIMENT_SETTINGS_DOC_ID)
	const snap = await getDoc(ref)
	if (snap.exists()) {
		cachedConfig = {
			...DEFAULT_EXPERIMENT_CONFIG,
			...snap.data(),
			experiments:
				snap.data().experiments ?? DEFAULT_EXPERIMENT_CONFIG.experiments,
		}
	} else {
		cachedConfig = { ...DEFAULT_EXPERIMENT_CONFIG }
	}
	return cachedConfig
}

export function clearExperimentConfigCache() {
	cachedConfig = null
}

/**
 * @param {typeof DEFAULT_EXPERIMENT_CONFIG} config
 * @returns {string}
 */
export function getActiveExperimentId(config) {
	return config?.activeExperimentId ?? DEFAULT_EXPERIMENT_CONFIG.activeExperimentId
}

/**
 * @typedef {Object} ActiveReportsQueryOptions
 * @property {string} [agency] Display-name filter (legacy / transition)
 * @property {string} [agencyId] Stable agency doc id filter (preferred for scoped queries)
 * @property {string} [topic]
 * @property {import('firebase/firestore').Timestamp} [dateFrom]
 * @property {import('firebase/firestore').Timestamp} [dateTo]
 * @property {boolean} [includeArchived]
 * @property {boolean} [onlyArchived]
 * @property {boolean} [allExperiments]
 * @property {string} [experimentId]
 * @property {string} [activeExperimentId]
 * @property {string} [userID]
 */

/**
 * Builds a Firestore query for operational report reads.
 *
 * Prefer `agencyId` for agency-scoped queries (matches security rules).
 * `agency` (display name) remains for transitional/legacy use only.
 *
 * @param {ActiveReportsQueryOptions} [options]
 * @returns {import('firebase/firestore').Query}
 */
export function buildActiveReportsQuery(options = {}) {
	const {
		agency,
		agencyId,
		topic,
		dateFrom,
		dateTo,
		includeArchived = false,
		onlyArchived = false,
		allExperiments = false,
		experimentId,
		activeExperimentId,
		userID,
	} = options

	const reportsRef = collection(db, 'reports')
	/** @type {import('firebase/firestore').QueryConstraint[]} */
	const constraints = []

	if (onlyArchived) {
		constraints.push(where('archived', '==', true))
	} else if (!includeArchived) {
		constraints.push(where('archived', '==', false))
	}

	const expId = experimentId ?? activeExperimentId
	if (expId && !allExperiments) {
		constraints.push(where('experimentId', '==', expId))
	}

	if (agencyId) {
		constraints.push(where('agencyId', '==', agencyId))
	} else if (agency) {
		constraints.push(where('agency', '==', agency))
	}

	if (userID) {
		constraints.push(where('userID', '==', userID))
	}

	if (topic) {
		constraints.push(where('topic', '==', topic))
	}

	if (dateFrom) {
		constraints.push(where('createdDate', '>=', dateFrom))
	}

	if (dateTo) {
		constraints.push(where('createdDate', '<', dateTo))
	}

	return query(reportsRef, ...constraints)
}

/**
 * Agency identity fields for new report documents.
 * Keep display `agency` for UI; `agencyId` for rules and scoped queries.
 *
 * @param {{ agencyName?: string, agencyId?: string }} opts
 * @returns {{ agency: string, agencyId: string }}
 */
export function newReportAgencyFields({ agencyName, agencyId }) {
	const name = typeof agencyName === 'string' ? agencyName.trim() : ''
	const id = typeof agencyId === 'string' ? agencyId.trim() : ''
	if (!id) {
		throw new Error('agencyId is required when creating a report')
	}
	return {
		agency: name,
		agencyId: id,
	}
}

/**
 * @param {import('firebase/firestore').Query} reportsQuery
 * @returns {Promise<Array<Record<string, unknown> & { reportID: string }>>}
 */
export async function fetchReportsFromQuery(reportsQuery) {
	const snapshot = await getDocs(reportsQuery)
	return snapshot.docs.map((d) => ({
		...d.data(),
		reportID: d.id,
	}))
}

/**
 * Admin reports table: all study waves (not scoped to active experiment).
 * Home/graphs/metrics still use active experiment from settings.
 *
 * @param {{ includeArchived: boolean }} options
 * @returns {Promise<Array<Record<string, unknown> & { reportID: string }>>}
 */
export async function fetchAdminReportsList({ includeArchived }) {
	return fetchReportsFromQuery(
		buildActiveReportsQuery({
			allExperiments: true,
			includeArchived,
		}),
	)
}

/**
 * Fields applied when creating a new report document.
 *
 * @param {string} experimentId
 * @returns {{ experimentId: string, archived: boolean }}
 */
export function newReportExperimentFields(experimentId) {
	return {
		experimentId,
		archived: false,
	}
}
