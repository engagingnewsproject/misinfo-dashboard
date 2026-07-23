import {
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	updateDoc,
	where,
	getCountFromServer,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { isAppWideLabel } from '../config/labels'

/**
 * Fetches the full Labels document slice for an agency.
 *
 * @param {string} agencyId
 * @returns {Promise<{ list: string[], active: string[], colors: Record<string, string> }>}
 */
export async function fetchAgencyLabelsData(agencyId) {
	if (!agencyId) {
		return { list: [], active: [], colors: {} }
	}

	const tagsDoc = await getDoc(doc(db, 'tags', agencyId))
	if (!tagsDoc.exists()) {
		return { list: [], active: [], colors: {} }
	}

	const labels = tagsDoc.data()?.Labels || {}
	return {
		list: labels.list || [],
		active: labels.active || [],
		colors: labels.colors || {},
	}
}

/**
 * Fetches active label tags for an agency.
 *
 * @param {string} agencyId
 * @returns {Promise<string[]>}
 */
export async function fetchAgencyActiveLabels(agencyId) {
	const { active } = await fetchAgencyLabelsData(agencyId)
	return active
}

/**
 * Fetches custom label colors for an agency.
 *
 * @param {string} agencyId
 * @returns {Promise<Record<string, string>>}
 */
export async function fetchAgencyLabelColors(agencyId) {
	const { colors } = await fetchAgencyLabelsData(agencyId)
	return colors
}

/**
 * Resolves a Firestore agency document ID from the agency display name.
 * Collection query — agency-claim users usually cannot run this under scoped rules;
 * prefer `report.agencyId` / claim `agencyId` first via `resolveAgencyIdForReport`.
 *
 * @param {string} agencyName
 * @returns {Promise<string|null>}
 */
export async function resolveAgencyIdByName(agencyName) {
	if (!agencyName) return null

	const agencyQuery = query(
		collection(db, 'agency'),
		where('name', '==', agencyName),
	)
	const snap = await getDocs(agencyQuery)
	if (snap.empty) return null

	return snap.docs[0].id
}

/**
 * Resolves agency doc id for a report without a banned cross-agency list query when possible.
 *
 * @param {{ agencyId?: string, agency?: string }|null|undefined} report
 * @param {string|null|undefined} claimAgencyId
 * @returns {Promise<string|null>}
 */
export async function resolveAgencyIdForReport(report, claimAgencyId) {
	const fromReport =
		typeof report?.agencyId === 'string' ? report.agencyId.trim() : ''
	if (fromReport) return fromReport
	const fromClaim =
		typeof claimAgencyId === 'string' ? claimAgencyId.trim() : ''
	if (fromClaim) return fromClaim
	return resolveAgencyIdByName(report?.agency)
}

/**
 * Fetches the agency display name from a Firestore agency ID.
 *
 * @param {string} agencyId
 * @returns {Promise<string|null>}
 */
export async function fetchAgencyNameById(agencyId) {
	if (!agencyId) return null

	const agencyDoc = await getDoc(doc(db, 'agency', agencyId))
	if (!agencyDoc.exists()) return null

	return agencyDoc.data()?.name || null
}

/**
 * Appends a custom label to an agency's Labels list and active set.
 *
 * @param {string} agencyId
 * @param {string} labelText
 * @returns {Promise<void>}
 */
export async function addAgencyCustomLabel(agencyId, labelText) {
	if (!agencyId || !labelText) return

	const tagsRef = doc(db, 'tags', agencyId)
	const tagsDoc = await getDoc(tagsRef)
	if (!tagsDoc.exists()) return

	const labels = tagsDoc.data().Labels || { list: [], active: [], colors: {} }
	const list = [...(labels.list || [])]
	const active = [...(labels.active || [])]
	const colors = { ...(labels.colors || {}) }
	const lower = labelText.toLowerCase()

	if (!list.some((l) => l.toLowerCase() === lower)) {
		list.push(labelText)
	}
	if (!active.some((l) => l.toLowerCase() === lower)) {
		active.push(labelText)
	}

	await updateDoc(tagsRef, {
		Labels: { list, active, colors },
	})
}

/**
 * Updates the color for a custom agency label.
 *
 * @param {string} agencyId
 * @param {string} labelText
 * @param {string} hexColor
 * @returns {Promise<void>}
 */
export async function updateAgencyLabelColor(agencyId, labelText, hexColor) {
	if (!agencyId || !labelText || !hexColor) return
	if (isAppWideLabel(labelText)) return

	const tagsRef = doc(db, 'tags', agencyId)
	const tagsDoc = await getDoc(tagsRef)
	if (!tagsDoc.exists()) return

	const labels = tagsDoc.data().Labels || { list: [], active: [], colors: {} }
	const colors = { ...(labels.colors || {}), [labelText]: hexColor }

	await updateDoc(tagsRef, {
		Labels: {
			list: labels.list || [],
			active: labels.active || [],
			colors,
		},
	})
}

/**
 * Removes a custom label from an agency's Labels document.
 *
 * @param {string} agencyId
 * @param {string} labelText
 * @returns {Promise<void>}
 */
export async function deleteAgencyCustomLabel(agencyId, labelText) {
	if (!agencyId || !labelText) return
	if (isAppWideLabel(labelText)) return

	const tagsRef = doc(db, 'tags', agencyId)
	const tagsDoc = await getDoc(tagsRef)
	if (!tagsDoc.exists()) return

	const labels = tagsDoc.data().Labels || { list: [], active: [], colors: {} }
	const lower = labelText.toLowerCase()
	const list = (labels.list || []).filter((l) => l.toLowerCase() !== lower)
	const active = (labels.active || []).filter((l) => l.toLowerCase() !== lower)
	const colors = { ...(labels.colors || {}) }
	delete colors[labelText]

	await updateDoc(tagsRef, {
		Labels: { list, active, colors },
	})
}

/**
 * Counts reports for an agency that use a given label.
 * Prefer agencyId so the query matches scoped Firestore rules
 * (`sameAgency()` requires resource.data.agencyId == token.agencyId).
 *
 * @param {string} agencyId
 * @param {string} labelText
 * @returns {Promise<number>}
 */
export async function countReportsWithLabel(agencyId, labelText) {
	if (!agencyId || !labelText) return 0

	const reportsQuery = query(
		collection(db, 'reports'),
		where('agencyId', '==', agencyId),
		where('label', '==', labelText),
	)
	const snapshot = await getCountFromServer(reportsQuery)
	return snapshot.data().count
}
