/**
 * Admin "Left out" tab. Shows articles from recent nights that the pipeline
 * clustered but didn't pick (another article in the same cluster won), next
 * to the winners that beat them. Promote sends one into the fallback agency
 * (Test Agency) as a normal report; from there an admin can Move it to the
 * right newsroom.
 *
 * Data comes from the pipeline-written `leftOutArticles` collection.
 */

import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import adminSectionStyles from '../../styles/adminSectionStyles'
import AdminDataTable from './AdminDataTable'
import {
	STATUS_PROMOTED,
	fetchLeftOutArticles,
	groupLeftOutArticles,
	promoteLeftOutArticle,
} from '../../utils/left-out-articles'

const style = adminSectionStyles

const COLUMNS = ['Article', 'State', 'Meatiness', { label: 'Action', center: true }]
const COLUMN_COUNT = COLUMNS.length

/**
 * @param {string} runTimestamp e.g. `20260928_070000`
 * @returns {string}
 */
function formatNight(runTimestamp) {
	const m = /^(\d{4})(\d{2})(\d{2})/.exec(runTimestamp || '')
	return m ? `${m[1]}-${m[2]}-${m[3]}` : runTimestamp || 'Unknown night'
}

/**
 * @param {number | null | undefined} score
 * @returns {string}
 */
function formatScore(score) {
	return typeof score === 'number' ? score.toFixed(2) : '—'
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatDate(value) {
	const date = value instanceof Timestamp ? value.toDate() : value instanceof Date ? value : null
	return date ? date.toLocaleString() : ''
}

/**
 * @param {Object} props
 * @param {() => Promise<import('../../utils/left-out-articles').LeftOutArticle[]>} [props.fetchArticles]
 * @param {(candidate: import('../../utils/left-out-articles').LeftOutArticle, user: { uid: string }) => Promise<{ reportId: string, agencyName: string }>} [props.promote]
 */
const LeftOutArticles = ({
	fetchArticles = () => fetchLeftOutArticles(db),
	promote = (candidate, user) => promoteLeftOutArticle(db, candidate, user),
}) => {
	const { user } = useAuth()
	const [articles, setArticles] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [showPromoted, setShowPromoted] = useState(false)
	const [promotingId, setPromotingId] = useState('')
	const [message, setMessage] = useState('')

	const load = useCallback(async () => {
		setLoading(true)
		try {
			setArticles(await fetchArticles())
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Could not load left-out articles')
		} finally {
			setLoading(false)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		load()
	}, [load])

	const visible = useMemo(
		() => (showPromoted ? articles : articles.filter((a) => a.status !== STATUS_PROMOTED)),
		[articles, showPromoted],
	)
	const nights = useMemo(() => groupLeftOutArticles(visible), [visible])

	const handlePromote = async (candidate) => {
		setPromotingId(candidate.id)
		setMessage('')
		setError('')
		try {
			const result = await promote(candidate, user)
			setArticles((prev) =>
				prev.map((a) =>
					a.id === candidate.id
						? { ...a, status: STATUS_PROMOTED, promotedReportId: result.reportId }
						: a,
				),
			)
			setMessage(`Promoted "${candidate.title}" to ${result.agencyName}`)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Promote failed')
			load()
		} finally {
			setPromotingId('')
		}
	}

	return (
		<div data-component="LeftOutArticles" className={style.section_container}>
			<div className={style.section_wrapper}>
				<div className={style.section_header}>
					<div className={style.section_title}>Left out</div>
					<div className={style.section_filtersWrap}>
						<label className="flex items-center gap-2 text-sm text-gray-700">
							<input
								type="checkbox"
								checked={showPromoted}
								onChange={(e) => setShowPromoted(e.target.checked)}
							/>
							Show promoted
						</label>
					</div>
				</div>
				<p className="text-sm text-gray-600 mb-3 ml-10 md:ml-0">
					Articles from the last 7 nights that lost out to other articles in the same
					cluster. Promote sends one to Test Agency with its state kept; use Move to
					agency on the report to send it to a newsroom.
				</p>
				{message && (
					<div role="status" className="text-sm text-green-700 mb-2 ml-10 md:ml-0">
						{message}
					</div>
				)}
				{error && (
					<div role="alert" className="text-sm text-red-600 mb-2 ml-10 md:ml-0">
						{error}
					</div>
				)}
				<AdminDataTable columns={COLUMNS}>
					{loading && (
						<tr>
							<td colSpan={COLUMN_COUNT} className={`${style.table_td} text-center`}>
								Loading...
							</td>
						</tr>
					)}
					{!loading && nights.length === 0 && (
						<tr>
							<td colSpan={COLUMN_COUNT} className={`${style.table_td} text-center`}>
								No left-out articles found
							</td>
						</tr>
					)}
					{!loading &&
						nights.map((night) => (
							<Fragment key={night.runTimestamp}>
								<tr>
									<td
										colSpan={COLUMN_COUNT}
										className={`${style.table_td} bg-gray-100 font-semibold`}>
										Night of {formatNight(night.runTimestamp)}
									</td>
								</tr>
								{night.clusters.map((cluster) => (
									<Fragment key={`${night.runTimestamp}-${cluster.clusterId}`}>
										<tr>
											<td colSpan={COLUMN_COUNT} className={`${style.table_td} bg-gray-50`}>
												<div className="font-medium">
													Cluster: {cluster.clusterName || `#${cluster.clusterId}`}
												</div>
												{cluster.winners.length > 0 && (
													<div className="text-xs text-gray-600 mt-1">
														Picked instead:{' '}
														{cluster.winners.map((w, i) => (
															<span key={w.url}>
																{i > 0 && '; '}
																<a
																	href={w.url}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="underline">
																	{w.title || w.url}
																</a>{' '}
																({formatScore(w.meatinessScore)})
															</span>
														))}
													</div>
												)}
											</td>
										</tr>
										{cluster.articles.map((article) => {
											const promoted = article.status === STATUS_PROMOTED
											return (
												<tr key={article.id} className={style.table_tr}>
													<td className={style.table_td}>
														<a
															href={article.url}
															target="_blank"
															rel="noopener noreferrer"
															className="underline">
															{article.title || article.url}
														</a>
														<div className="text-xs text-gray-500">
															{article.domain}
															{promoted && article.promotedAt
																? ` · promoted ${formatDate(article.promotedAt)}`
																: ''}
														</div>
													</td>
													<td className={style.table_td}>{article.state || '—'}</td>
													<td className={style.table_td}>
														{formatScore(article.meatinessScore)}
													</td>
													<td className={`${style.table_td} text-center`}>
														{promoted ? (
															<span className="text-sm text-gray-500">Promoted</span>
														) : (
															<button
																type="button"
																disabled={!!promotingId}
																onClick={() => handlePromote(article)}
																className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
																{promotingId === article.id ? 'Promoting…' : 'Promote'}
															</button>
														)}
													</td>
												</tr>
											)
										})}
									</Fragment>
								))}
							</Fragment>
						))}
				</AdminDataTable>
			</div>
		</div>
	)
}

export default LeftOutArticles
