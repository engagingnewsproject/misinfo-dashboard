/**
 * Display helpers for Truth Sleuth pipeline run summaries.
 * Turns BigQuery rundown rows into labels, counts, and issue lists for the
 * admin Pipeline tab.
 */

export const DATA_STUDIO_EMBED_SRC =
	'https://datastudio.google.com/embed/reporting/c39e73c0-db85-44c2-9ea0-a12de00953b3/page/tEnnC'

export const DATA_STUDIO_EMBED_SANDBOX =
	'allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox'

export const FUNNEL_STAGES = [
	{ key: 'links_rows', label: 'Links' },
	{ key: 'extracted_rows', label: 'Extracted' },
	{ key: 'election_rows', label: 'Election' },
	{ key: 'geographic_rows', label: 'Geographic' },
	{ key: 'clustered_rows', label: 'Clustered' },
	{ key: 'curated_rows', label: 'Curated' },
	{ key: 'dashboard_rows', label: 'Dashboard' },
]

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatCount(value) {
	if (value == null || value === '') return '—'
	const n = Number(value)
	if (!Number.isFinite(n)) return '—'
	return n.toLocaleString()
}

/**
 * @param {unknown} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
	if (seconds == null || seconds === '') return '—'
	const total = Number(seconds)
	if (!Number.isFinite(total) || total < 0) return '—'
	const rounded = Math.round(total)
	const hours = Math.floor(rounded / 3600)
	const minutes = Math.floor((rounded % 3600) / 60)
	const secs = rounded % 60
	if (hours > 0) return `${hours}h ${minutes}m`
	if (minutes > 0) return `${minutes}m ${secs}s`
	return `${secs}s`
}

/**
 * @param {unknown} value Night key like `20260811_070316`
 * @returns {string}
 */
export function formatRunTimestamp(value) {
	if (typeof value !== 'string' || !value.trim()) return '—'
	const match = value
		.trim()
		.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/)
	if (!match) return value.trim()
	return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}`
}

/**
 * @param {unknown} status
 * @returns {string}
 */
export function formatHealth(status) {
	const key = String(status || '').trim()
	return key || 'unknown'
}

/**
 * Tailwind classes for a health pill.
 *
 * @param {unknown} status
 * @returns {string}
 */
export function healthBadgeClass(status) {
	const key = String(status || '')
		.trim()
		.toLowerCase()
	if (key === 'ok') return 'bg-green-100 text-green-800'
	if (key === 'warning') return 'bg-amber-100 text-amber-800'
	if (key === 'critical') return 'bg-red-100 text-red-800'
	return 'bg-gray-100 text-gray-700'
}

/**
 * Parse `issues_json` / `steps_completed_json` cells.
 *
 * @param {unknown} raw
 * @returns {unknown[]}
 */
export function parseJsonArray(raw) {
	if (Array.isArray(raw)) return raw
	if (typeof raw !== 'string' || !raw.trim()) return []
	try {
		const parsed = JSON.parse(raw)
		return Array.isArray(parsed) ? parsed : []
	} catch {
		return []
	}
}

/**
 * @param {unknown} issue
 * @returns {string}
 */
export function formatIssueMessage(issue) {
	if (typeof issue === 'string') return issue
	if (issue && typeof issue === 'object') {
		const row = /** @type {{ message?: unknown, code?: unknown }} */ (issue)
		if (typeof row.message === 'string' && row.message.trim()) {
			return row.message.trim()
		}
		if (typeof row.code === 'string' && row.code.trim()) {
			return row.code.trim()
		}
	}
	return ''
}

/**
 * Stable key for a rundown row.
 *
 * @param {Record<string, unknown>} run
 * @param {number} [index]
 * @returns {string}
 */
export function pipelineRunKey(run, index = 0) {
	const parts = [
		run?.run_timestamp,
		run?.measurement_run_id,
		run?.execution_name,
		index,
	].filter((part) => part != null && part !== '')
	return parts.join('|') || String(index)
}
