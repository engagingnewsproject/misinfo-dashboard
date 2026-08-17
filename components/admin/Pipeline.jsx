/**
 * Admin Pipeline tab — recent Truth Sleuth run health plus Data Studio.
 *
 * Shows a BigQuery rundown of nightly jobs, then embeds the articles report.
 * The tab is Firebase-admin only; the iframe still needs a Google account
 * that can open the Data Studio report.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@material-tailwind/react'
import PageTitle from '../layout/PageTitle'
import AdminDataTable from './AdminDataTable'
import LoadingSpinner from '../ui/LoadingSpinner'
import adminSectionStyles from '../../styles/adminSectionStyles'
import { fetchPipelineRuns } from '../../utils/fetch-pipeline-runs'
import {
	DATA_STUDIO_EMBED_SANDBOX,
	DATA_STUDIO_EMBED_SRC,
	FUNNEL_STAGES,
	formatCount,
	formatDuration,
	formatHealth,
	formatIssueMessage,
	formatRunTimestamp,
	healthBadgeClass,
	parseJsonArray,
	pipelineRunKey,
} from '../../utils/pipeline-runs'

const style = adminSectionStyles

const RUN_COLUMNS = [
	'Night',
	'Run ID',
	'Health',
	'Duration',
	'Links',
	'Extracted',
	'Election',
	'Geo',
	'Curated',
	'Dashboard',
]

/**
 * @param {unknown} err
 * @returns {string}
 */
function formatFetchError(err) {
	if (typeof err === 'object' && err !== null) {
		const e = /** @type {{ details?: unknown, message?: string }} */ (err)
		if (typeof e.details === 'string' && e.details.trim()) return e.details
		if (e.message && e.message !== 'INTERNAL') return e.message
	}
	return 'Failed to load pipeline runs.'
}

/**
 * @param {Record<string, unknown>} run
 */
function HealthBadge({ run }) {
	const label = formatHealth(run.health_status)
	return (
		<span
			className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${healthBadgeClass(
				run.health_status,
			)}`}>
			{label}
		</span>
	)
}

/**
 * @param {{ fetchRuns?: typeof fetchPipelineRuns }} props
 */
const Pipeline = ({ fetchRuns = fetchPipelineRuns }) => {
	const [runs, setRuns] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [selectedKey, setSelectedKey] = useState('')

	const loadRuns = useCallback(async () => {
		setLoading(true)
		setError('')
		try {
			const next = await fetchRuns(20)
			setRuns(next)
			setSelectedKey((prev) => {
				if (prev && next.some((run, index) => pipelineRunKey(run, index) === prev)) {
					return prev
				}
				return next.length ? pipelineRunKey(next[0], 0) : ''
			})
		} catch (err) {
			console.error(err)
			setRuns([])
			setSelectedKey('')
			setError(formatFetchError(err))
		} finally {
			setLoading(false)
		}
	}, [fetchRuns])

	useEffect(() => {
		loadRuns()
	}, [loadRuns])

	const selectedRun = useMemo(
		() =>
			runs.find((run, index) => pipelineRunKey(run, index) === selectedKey) ||
			null,
		[runs, selectedKey],
	)

	const latest = runs[0] || null
	const issues = parseJsonArray(selectedRun?.issues_json)
	const steps = parseJsonArray(selectedRun?.steps_completed_json)

	return (
		<div data-component="Pipeline" className={style.section_container}>
			<div className={style.section_wrapper}>
				<div className={style.section_header}>
					<PageTitle gutter={false}>Pipeline</PageTitle>
					<Button
						size="sm"
						color="blue"
						variant="outlined"
						onClick={loadRuns}
						disabled={loading}>
						Refresh
					</Button>
				</div>

				<p className="mb-4 text-sm text-gray-600">
					Nightly Truth Sleuth job health. The report below still signs in
					with a Google account that can open Data Studio — dashboard admin
					login does not unlock it.
				</p>

				{loading && (
					<div className="flex items-center gap-3 py-8 text-sm text-gray-600">
						<LoadingSpinner className="h-8 w-8 text-[#2E3B4E]" />
						Loading recent runs…
					</div>
				)}

				{!loading && error && (
					<p className="mb-4 text-sm text-red-700" role="alert">
						{error}
					</p>
				)}

				{!loading && !error && latest && (
					<div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
						<div className="rounded-md border border-blue-gray-100 bg-white p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
								Latest health
							</p>
							<div className="mt-2">
								<HealthBadge run={latest} />
							</div>
							<p className="mt-2 text-xs text-gray-500">
								{formatRunTimestamp(latest.run_timestamp)}
							</p>
						</div>
						<div className="rounded-md border border-blue-gray-100 bg-white p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
								Duration
							</p>
							<p className="mt-2 text-lg font-semibold text-[#2E3B4E]">
								{formatDuration(latest.duration_seconds)}
							</p>
						</div>
						<div className="rounded-md border border-blue-gray-100 bg-white p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
								Dashboard articles
							</p>
							<p className="mt-2 text-lg font-semibold text-[#2E3B4E]">
								{formatCount(latest.dashboard_rows)}
							</p>
						</div>
						<div className="rounded-md border border-blue-gray-100 bg-white p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
								Curated
							</p>
							<p className="mt-2 text-lg font-semibold text-[#2E3B4E]">
								{formatCount(latest.curated_rows)}
							</p>
						</div>
					</div>
				)}

				{!loading && !error && latest && (
					<div className="mb-6 flex flex-wrap gap-2">
						{FUNNEL_STAGES.map((stage) => (
							<div
								key={stage.key}
								className="rounded-md bg-slate-100 px-3 py-2 text-sm">
								<span className="text-gray-500">{stage.label}: </span>
								<span className="font-semibold text-[#2E3B4E]">
									{formatCount(latest[stage.key])}
								</span>
							</div>
						))}
					</div>
				)}

				{!loading && !error && (
					<div className="flex flex-col gap-4 lg:flex-row lg:items-start">
						<div className="min-w-0 max-h-[550px] overflow-auto rounded-md bg-white lg:w-3/4 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10">
							<AdminDataTable columns={RUN_COLUMNS}>
								{runs.length === 0 && (
									<tr>
										<td
											colSpan={RUN_COLUMNS.length}
											className={`${style.table_td} text-center`}>
											No pipeline runs found.
										</td>
									</tr>
								)}
								{runs.map((run, index) => {
									const key = pipelineRunKey(run, index)
									const isSelected = key === selectedKey
									return (
										<tr
											key={key}
											className={`${style.table_tr} ${
												isSelected ? 'bg-indigo-50' : ''
											}`}
											onClick={() => setSelectedKey(key)}
											aria-selected={isSelected}>
											<td className={style.table_td}>
												{formatRunTimestamp(run.run_timestamp)}
											</td>
											<td className={style.table_td}>
												{run.measurement_run_id || '—'}
											</td>
											<td className={style.table_td}>
												<HealthBadge run={run} />
											</td>
											<td className={style.table_td}>
												{formatDuration(run.duration_seconds)}
											</td>
											<td className={style.table_td}>
												{formatCount(run.links_rows)}
											</td>
											<td className={style.table_td}>
												{formatCount(run.extracted_rows)}
											</td>
											<td className={style.table_td}>
												{formatCount(run.election_rows)}
											</td>
											<td className={style.table_td}>
												{formatCount(run.geographic_rows)}
											</td>
											<td className={style.table_td}>
												{formatCount(run.curated_rows)}
											</td>
											<td className={style.table_td}>
												{formatCount(run.dashboard_rows)}
											</td>
										</tr>
									)
								})}
							</AdminDataTable>
						</div>

						{selectedRun && (
							<aside className="flex w-full flex-col gap-3 rounded-md border border-blue-gray-100 bg-white p-4 lg:w-1/4">
								<h2 className="text-lg font-semibold text-[#2E3B4E]">
									Run details
								</h2>
								<dl className="flex flex-col gap-3 text-sm">
									<div>
										<dt className="text-gray-500">Run ID</dt>
										<dd className="break-words font-medium text-[#2E3B4E]">
											{selectedRun.measurement_run_id || '—'}
										</dd>
									</div>
									<div>
										<dt className="text-gray-500">Execution</dt>
										<dd className="break-words font-medium text-[#2E3B4E]">
											{selectedRun.execution_name || '—'}
										</dd>
									</div>
									<div>
										<dt className="text-gray-500">Image tag</dt>
										<dd className="break-words font-medium text-[#2E3B4E]">
											{selectedRun.image_tag || '—'}
										</dd>
									</div>
									<div>
										<dt className="text-gray-500">Classifier mode</dt>
										<dd className="break-words font-medium text-[#2E3B4E]">
											{selectedRun.election_classifier_mode || '—'}
										</dd>
									</div>
									<div>
										<dt className="text-gray-500">Pipeline status</dt>
										<dd className="break-words font-medium text-[#2E3B4E]">
											{selectedRun.pipeline_status || '—'}
										</dd>
									</div>
									<div>
										<dt className="text-gray-500">Night</dt>
										<dd className="font-medium text-[#2E3B4E]">
											{formatRunTimestamp(selectedRun.run_timestamp)}
										</dd>
									</div>
									<div>
										<dt className="text-gray-500">Steps completed</dt>
										<dd className="break-words text-[#2E3B4E]">
											{steps.length ? steps.map(String).join(', ') : '—'}
										</dd>
									</div>
									<div>
										<dt className="text-gray-500">Issues</dt>
										<dd>
											{issues.length === 0 ? (
												<p className="text-[#2E3B4E]">None recorded.</p>
											) : (
												<ul className="mt-1 list-disc pl-5 text-[#2E3B4E]">
													{issues.map((issue, index) => (
														<li
															key={`${formatIssueMessage(issue)}-${index}`}>
															{formatIssueMessage(issue) ||
																'Unnamed issue'}
														</li>
													))}
												</ul>
											)}
										</dd>
									</div>
								</dl>
							</aside>
						)}
					</div>
				)}

				<div className="mt-8">
					<h2 className="mb-2 text-lg font-semibold text-[#2E3B4E]">
						Data Studio
					</h2>
					<iframe
						title="Truth Sleuth Data Studio articles report"
						src={DATA_STUDIO_EMBED_SRC}
						sandbox={DATA_STUDIO_EMBED_SANDBOX}
						allowFullScreen
						className="h-[900px] w-full rounded-md border-0 bg-white"
					/>
				</div>
			</div>
		</div>
	)
}

export default Pipeline
