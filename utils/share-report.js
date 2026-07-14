/**
 * Helpers for sharing a report by email or clipboard link.
 * Keeps share URLs and mailto payloads consistent across the dashboard.
 */

/** Relative dashboard path for a single report. */
export function buildReportSharePath(reportId) {
	if (!reportId) return '/dashboard'
	return `/dashboard/reports/${reportId}`
}

/**
 * Builds an absolute URL colleagues can open in the browser.
 *
 * Uses the current origin in the browser; falls back to a relative path
 * when `window` is unavailable (e.g. SSR).
 *
 * @param {string} reportId - Firestore report document id
 * @param {string} [origin] - Optional origin override (testing)
 * @returns {string} Absolute or path-only share URL
 */
export function buildReportShareUrl(reportId, origin) {
	const path = buildReportSharePath(reportId)
	const base =
		origin ??
		(typeof window !== 'undefined' ? window.location.origin : '')
	return base ? `${base}${path}` : path
}

/**
 * Opens the user's mail client with a pre-filled share message.
 *
 * Email is optional — omit it to let the user pick a recipient in their
 * mail app. Subject and body always include a link to the report.
 *
 * @param {Object} options
 * @param {string} [options.email] - Optional recipient address
 * @param {string} [options.title] - Report title for the subject line
 * @param {string} options.url - Absolute (or path) URL to include in the body
 */
export function openReportShareEmail({ email = '', title = '', url }) {
	if (!url || typeof window === 'undefined') return

	const subject = title?.trim()
		? `Misinfo Report: ${title.trim()}`
		: 'Misinfo Report'
	const body = `Link to report:\n${url}`
	const to = typeof email === 'string' ? email.trim() : ''
	const uri = `mailto:${to}?subject=${encodeURIComponent(
		subject,
	)}&body=${encodeURIComponent(body)}`
	window.open(uri)
}

/**
 * Copies the report share URL to the clipboard.
 *
 * Uses the Clipboard API when available, with a textarea fallback for
 * older browsers.
 *
 * @param {string} url - URL to copy
 * @returns {Promise<boolean>} True when the copy succeeded
 */
export async function copyReportShareLink(url) {
	if (!url) return false

	if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(url)
			return true
		} catch {
			// fall through to legacy path
		}
	}

	if (typeof document === 'undefined') return false

	const textarea = document.createElement('textarea')
	textarea.value = url
	textarea.setAttribute('readonly', '')
	textarea.style.position = 'fixed'
	textarea.style.left = '-9999px'
	document.body.appendChild(textarea)
	textarea.select()
	let ok = false
	try {
		ok = document.execCommand('copy')
	} catch {
		ok = false
	}
	document.body.removeChild(textarea)
	return ok
}
