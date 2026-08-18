/**
 * Loads recent pipeline rundown rows for signed-in admins.
 */

import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../config/firebase'

/**
 * @param {number} [limit]
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function fetchPipelineRuns(limit = 20) {
	const fn = getFunctions(app, 'us-central1')
	const getPipelineRuns = httpsCallable(fn, 'getPipelineRuns')
	const result = await getPipelineRuns({ limit })
	const runs = result?.data?.runs
	return Array.isArray(runs) ? runs : []
}
