import {
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	updateDoc,
	where,
} from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Fetches active label tags for an agency.
 *
 * @param {string} agencyId
 * @returns {Promise<string[]>}
 */
export async function fetchAgencyActiveLabels(agencyId) {
	if (!agencyId) return []

	const tagsDoc = await getDoc(doc(db, 'tags', agencyId))
	if (!tagsDoc.exists()) return []

	return tagsDoc.data()?.Labels?.active || []
}

/**
 * Resolves a Firestore agency document ID from the agency display name.
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

	const labels = tagsDoc.data().Labels || { list: [], active: [] }
	const list = [...(labels.list || [])]
	const active = [...(labels.active || [])]
	const lower = labelText.toLowerCase()

	if (!list.some((l) => l.toLowerCase() === lower)) {
		list.push(labelText)
	}
	if (!active.some((l) => l.toLowerCase() === lower)) {
		active.push(labelText)
	}

	await updateDoc(tagsRef, {
		Labels: { list, active },
	})
}
