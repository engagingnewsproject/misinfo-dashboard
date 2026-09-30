/**
 * "Left out" admin list: articles the nightly pipeline clustered but did not
 * pick ("not top in cluster"), so they never reached newsrooms. Admins can
 * Promote one, which creates a normal report in the fallback agency (Test
 * Agency) with the detected state kept, ready to Move to agency.
 *
 * The pipeline writes `leftOutArticles` docs (see the shared contract in the
 * promote plan); the dashboard only reads them and sets the promotion fields.
 */

import {
	collection,
	doc,
	getDocs,
	limit,
	orderBy,
	query,
	runTransaction,
	where,
} from 'firebase/firestore'
import {
	fetchExperimentConfig,
	getActiveExperimentId,
	newReportAgencyFields,
	newReportExperimentFields,
} from './reports-queries'
import { PROD_DEFAULTS, getPipelineConfig } from './pipeline-config'

export const LEFT_OUT_COLLECTION = 'leftOutArticles'
export const ROUTING_REASON_PROMOTED = 'promoted_from_cluster'
export const STATUS_PENDING = 'pending'
export const STATUS_PROMOTED = 'promoted'

/**
 * @typedef {Object} LeftOutWinner
 * @property {string} url
 * @property {string} title
 * @property {number | null} meatinessScore
 */

/**
 * @typedef {Object} LeftOutArticle
 * @property {string} id
 * @property {string} runTimestamp
 * @property {string} swingRunId
 * @property {unknown} createdAt
 * @property {string} url
 * @property {string} title
 * @property {string} domain
 * @property {string} state
 * @property {number} clusterId
 * @property {string} clusterName
 * @property {number | null} meatinessScore
 * @property {LeftOutWinner[]} winners
 * @property {Record<string, unknown>} report
 * @property {string} status
 * @property {string} [promotedBy]
 * @property {unknown} [promotedAt]
 * @property {string} [promotedReportId]
 */

/**
 * @param {import('firebase/firestore').Firestore} db
 * @param {{ days?: number, max?: number }} [options]
 * @returns {Promise<LeftOutArticle[]>}
 */
export async function fetchLeftOutArticles(db, { days = 7, max = 500 } = {}) {
	const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
	const snap = await getDocs(
		query(
			collection(db, LEFT_OUT_COLLECTION),
			where('createdAt', '>=', since),
			orderBy('createdAt', 'desc'),
			limit(max),
		),
	)
	return snap.docs.map((d) => ({ ...d.data(), id: d.id }))
}

/**
 * Report document for a promoted left-out article.
 *
 * @param {LeftOutArticle} candidate
 * @param {{ agencyId: string, agencyName: string, experimentId: string, uid: string, promotedAt?: Date }} opts
 * @returns {Record<string, unknown>}
 */
export function buildPromotedReport(
	candidate,
	{ agencyId, agencyName, experimentId, uid, promotedAt = new Date() },
) {
	const content = candidate?.report && typeof candidate.report === 'object' ? candidate.report : {}
	return {
		...content,
		...newReportAgencyFields({ agencyName, agencyId }),
		...newReportExperimentFields(experimentId),
		state: candidate?.state || '',
		routingReason: ROUTING_REASON_PROMOTED,
		promotedBy: uid || '',
		promotedAt,
		leftOutArticleId: candidate?.id || '',
		scrapedAt: content.createdDate ?? null,
		createdDate: promotedAt,
	}
}

/**
 * Group left-out articles by night, then cluster (newest night first).
 *
 * @param {LeftOutArticle[]} articles
 * @returns {Array<{ runTimestamp: string, clusters: Array<{ clusterId: number, clusterName: string, winners: LeftOutWinner[], articles: LeftOutArticle[] }> }>}
 */
export function groupLeftOutArticles(articles) {
	const nights = new Map()
	for (const a of articles) {
		const night = a.runTimestamp || ''
		if (!nights.has(night)) nights.set(night, new Map())
		const clusters = nights.get(night)
		const key = String(a.clusterId ?? '')
		if (!clusters.has(key)) {
			clusters.set(key, {
				clusterId: a.clusterId,
				clusterName: a.clusterName || '',
				winners: Array.isArray(a.winners) ? a.winners : [],
				articles: [],
			})
		}
		clusters.get(key).articles.push(a)
	}
	return [...nights.entries()]
		.sort(([a], [b]) => b.localeCompare(a))
		.map(([runTimestamp, clusters]) => ({
			runTimestamp,
			clusters: [...clusters.values()].map((c) => ({
				...c,
				articles: [...c.articles].sort(
					(x, y) => (y.meatinessScore ?? -1) - (x.meatinessScore ?? -1),
				),
			})),
		}))
}

/**
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} name
 * @returns {Promise<{ id: string, name: string }>}
 */
async function findAgencyByName(db, name) {
	const snap = await getDocs(query(collection(db, 'agency'), where('name', '==', name)))
	if (snap.empty) {
		throw new Error(`Fallback agency "${name}" not found`)
	}
	return { id: snap.docs[0].id, name }
}

/**
 * Promote a left-out article into the fallback agency (Test Agency).
 * Refuses if someone already promoted it.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {LeftOutArticle} candidate
 * @param {{ uid: string }} user
 * @returns {Promise<{ reportId: string, agencyName: string }>}
 */
export async function promoteLeftOutArticle(db, candidate, user) {
	const settings = await getPipelineConfig(db)
	const fallbackName =
		settings.firestoreImportAgencyName || PROD_DEFAULTS.firestoreImportAgencyName
	const agency = await findAgencyByName(db, fallbackName)
	const experimentId = getActiveExperimentId(await fetchExperimentConfig())

	const candidateRef = doc(db, LEFT_OUT_COLLECTION, candidate.id)
	const reportRef = doc(collection(db, 'reports'))
	const promotedAt = new Date()

	await runTransaction(db, async (tx) => {
		const snap = await tx.get(candidateRef)
		if (!snap.exists()) {
			throw new Error('This left-out article no longer exists')
		}
		const current = { ...snap.data(), id: snap.id }
		if (current.status === STATUS_PROMOTED) {
			throw new Error('Already promoted')
		}
		tx.set(
			reportRef,
			buildPromotedReport(current, {
				agencyId: agency.id,
				agencyName: agency.name,
				experimentId,
				uid: user?.uid || '',
				promotedAt,
			}),
		)
		tx.update(candidateRef, {
			status: STATUS_PROMOTED,
			promotedBy: user?.uid || '',
			promotedAt,
			promotedReportId: reportRef.id,
		})
	})

	return { reportId: reportRef.id, agencyName: agency.name }
}
