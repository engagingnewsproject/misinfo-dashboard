/**
 * Admin "Move to agency": send a report (usually from Test Agency) to every
 * newsroom in a state, the same way the nightly pipeline import fans out.
 *
 * The existing report becomes the first newsroom's copy; each other newsroom
 * in that state gets a new copy. Moved copies start fresh for the newsroom
 * (unread, no label, no note) and record who moved them and from where.
 */

import {
	collection,
	doc,
	getDoc,
	getDocs,
	writeBatch,
} from 'firebase/firestore'

export const ROUTING_REASON_MOVED = 'moved_by_admin'

/**
 * @typedef {{ id: string, name: string, state: string }} AgencyOption
 */

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeState(value) {
	return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

/**
 * Newsrooms in a state, matched case-insensitively (agency docs are few).
 * When the report's current agency is in that state it is listed first so the
 * original report stays with it.
 *
 * @param {AgencyOption[]} agencies
 * @param {string} state
 * @param {string} [currentAgencyId]
 * @returns {AgencyOption[]}
 */
export function agenciesForState(agencies, state, currentAgencyId = '') {
	const key = normalizeState(state)
	if (!key) return []
	const matches = agencies
		.filter((a) => normalizeState(a.state) === key)
		.sort((a, b) => a.name.localeCompare(b.name))
	const currentIndex = matches.findIndex((a) => a.id === currentAgencyId)
	if (currentIndex > 0) {
		const [current] = matches.splice(currentIndex, 1)
		matches.unshift(current)
	}
	return matches
}

/**
 * Fields that change when a report is moved to one newsroom.
 *
 * @param {AgencyOption} agency
 * @param {{ uid: string, fromAgency: string, movedAt?: Date }} meta
 * @returns {Record<string, unknown>}
 */
export function buildMovedReportUpdates(agency, { uid, fromAgency, movedAt = new Date() }) {
	if (!agency?.id) {
		throw new Error('Target agency must have an id')
	}
	return {
		agency: agency.name,
		agencyId: agency.id,
		state: agency.state,
		routingReason: ROUTING_REASON_MOVED,
		movedFromAgency: fromAgency || '',
		movedBy: uid || '',
		movedAt,
		read: false,
		label: '',
		note: '',
	}
}

/**
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<AgencyOption[]>}
 */
export async function fetchAgencyOptions(db) {
	const snap = await getDocs(collection(db, 'agency'))
	return snap.docs.map((d) => {
		const data = d.data() || {}
		return {
			id: d.id,
			name: typeof data.name === 'string' ? data.name : '',
			state: typeof data.state === 'string' ? data.state : '',
		}
	})
}

/**
 * Move a report to every newsroom in `state`.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} reportId
 * @param {string} state
 * @param {{ uid: string }} user
 * @returns {Promise<{ reportIds: string[], agencies: AgencyOption[] }>}
 */
export async function moveReportToState(db, reportId, state, user) {
	const reportRef = doc(db, 'reports', reportId)
	const snap = await getDoc(reportRef)
	if (!snap.exists()) {
		throw new Error('Report not found')
	}
	const report = snap.data() || {}
	if (typeof report.experimentId !== 'string' || !report.experimentId) {
		throw new Error('Report has no experimentId; cannot copy it to newsrooms')
	}

	const targets = agenciesForState(
		await fetchAgencyOptions(db),
		state,
		typeof report.agencyId === 'string' ? report.agencyId : '',
	)
	if (targets.length === 0) {
		throw new Error(`No newsrooms found for ${state || 'this state'}`)
	}

	const meta = {
		uid: user?.uid || '',
		fromAgency: typeof report.agency === 'string' ? report.agency : '',
		movedAt: new Date(),
	}
	const batch = writeBatch(db)
	const reportIds = [reportId]
	batch.update(reportRef, buildMovedReportUpdates(targets[0], meta))
	for (const agency of targets.slice(1)) {
		const copyRef = doc(collection(db, 'reports'))
		batch.set(copyRef, {
			...report,
			archived: false,
			...buildMovedReportUpdates(agency, meta),
		})
		reportIds.push(copyRef.id)
	}
	await batch.commit()
	return { reportIds, agencies: targets }
}
