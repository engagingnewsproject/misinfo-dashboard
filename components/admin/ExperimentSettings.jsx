/**
 * Admin controls for experiment cohorts, bulk archive, and metrics preview.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../../config/firebase'
import {
	clearExperimentConfigCache,
	fetchExperimentConfig,
	getActiveExperimentId,
} from '../../utils/reports-queries'
import { DEFAULT_ARCHIVE_CUTOFF_ISO } from '../../utils/experiment-config'
import globalStyles from '../../styles/globalStyles'
import { Button, Typography } from '@material-tailwind/react'

/** @param {unknown} err */
function formatCallableError(err, fallback) {
	if (typeof err === 'object' && err !== null) {
		const e = /** @type {{ details?: unknown; message?: string; code?: string }} */ (
			err
		)
		if (typeof e.details === 'string' && e.details.trim()) {
			return e.details
		}
		if (e.message && e.message !== 'INTERNAL') {
			return e.message
		}
		if (e.code && e.code !== 'functions/internal') {
			return `${e.code}: ${fallback}`
		}
	}
	return `${fallback} Check the Functions emulator terminal log for details.`
}

function getExperimentFunctions() {
	const fn = getFunctions(app, 'us-central1')
	return {
		setActiveExperiment: httpsCallable(fn, 'setActiveExperiment'),
		addExperiment: httpsCallable(fn, 'addExperiment'),
		previewBulkArchive: httpsCallable(fn, 'previewBulkArchive'),
		bulkArchiveReports: httpsCallable(fn, 'bulkArchiveReports'),
		backfillReportExperimentFields: httpsCallable(
			fn,
			'backfillReportExperimentFields',
		),
		getExperimentMetrics: httpsCallable(fn, 'getExperimentMetrics'),
	}
}

const ExperimentSettings = () => {
	const [config, setConfig] = useState(null)
	const [selectedExperimentId, setSelectedExperimentId] = useState('')
	const [cutoffDate, setCutoffDate] = useState('2026-01-01')
	const [previewCount, setPreviewCount] = useState(null)
	const [metrics, setMetrics] = useState(null)
	const [status, setStatus] = useState('')
	const [busy, setBusy] = useState(false)
	const [newExperimentId, setNewExperimentId] = useState('')
	const [newExperimentLabel, setNewExperimentLabel] = useState('')
	const [setNewAsActive, setSetNewAsActive] = useState(true)

	const loadConfig = useCallback(async () => {
		clearExperimentConfigCache()
		const next = await fetchExperimentConfig(true)
		setConfig(next)
		setSelectedExperimentId(getActiveExperimentId(next))
	}, [])

	useEffect(() => {
		loadConfig()
	}, [loadConfig])

	const refreshMetrics = async (experimentId) => {
		const { getExperimentMetrics } = getExperimentFunctions()
		const result = await getExperimentMetrics({
			experimentId,
			includeArchived: false,
		})
		setMetrics(result.data)
	}

	useEffect(() => {
		if (selectedExperimentId) {
			refreshMetrics(selectedExperimentId).catch((err) => {
				console.error(err)
			})
		}
	}, [selectedExperimentId])

	const handleAddExperiment = async () => {
		setBusy(true)
		setStatus('')
		try {
			const { addExperiment } = getExperimentFunctions()
			const result = await addExperiment({
				id: newExperimentId.trim(),
				label: newExperimentLabel.trim(),
				setActive: setNewAsActive,
			})
			clearExperimentConfigCache()
			await loadConfig()
			setSelectedExperimentId(result.data.activeExperimentId)
			setNewExperimentId('')
			setNewExperimentLabel('')
			setStatus(
				`Added ${result.data.addedId}${
					setNewAsActive ? ' and set as active experiment.' : '.'
				}`,
			)
		} catch (err) {
			setStatus(formatCallableError(err, 'Failed to add experiment.'))
		} finally {
			setBusy(false)
		}
	}

	const handleSetActiveExperiment = async () => {
		setBusy(true)
		setStatus('')
		try {
			const { setActiveExperiment } = getExperimentFunctions()
			await setActiveExperiment({ experimentId: selectedExperimentId })
			clearExperimentConfigCache()
			await loadConfig()
			setStatus('Active experiment updated.')
		} catch (err) {
			setStatus(formatCallableError(err, 'Failed to update active experiment.'))
		} finally {
			setBusy(false)
		}
	}

	const handlePreviewArchive = async () => {
		setBusy(true)
		setStatus('')
		try {
			const { previewBulkArchive } = getExperimentFunctions()
			const cutoffISO = new Date(cutoffDate).toISOString()
			const result = await previewBulkArchive({ cutoffISO })
			setPreviewCount(result.data.count)
			setStatus(
				`${result.data.count} report(s) would be archived (before ${cutoffDate}).`,
			)
		} catch (err) {
			setStatus(formatCallableError(err, 'Preview failed.'))
		} finally {
			setBusy(false)
		}
	}

	const handleBulkArchive = async () => {
		if (
			!window.confirm(
				`Archive all non-archived reports created before ${cutoffDate}?`,
			)
		) {
			return
		}
		setBusy(true)
		setStatus('')
		try {
			const { bulkArchiveReports } = getExperimentFunctions()
			const cutoffISO = new Date(cutoffDate).toISOString()
			const result = await bulkArchiveReports({ cutoffISO })
			setStatus(`Archived ${result.data.updated} report(s).`)
			setPreviewCount(null)
			await refreshMetrics(selectedExperimentId)
		} catch (err) {
			setStatus(formatCallableError(err, 'Bulk archive failed.'))
		} finally {
			setBusy(false)
		}
	}

	const handleBackfill = async () => {
		if (
			!window.confirm(
				'Backfill missing experimentId/archived fields on all reports? Run once per environment.',
			)
		) {
			return
		}
		setBusy(true)
		setStatus('')
		try {
			const { backfillReportExperimentFields } = getExperimentFunctions()
			const result = await backfillReportExperimentFields({})
			clearExperimentConfigCache()
			await loadConfig()
			setStatus(`Backfill updated ${result.data.updated} report(s).`)
		} catch (err) {
			setStatus(formatCallableError(err, 'Backfill failed.'))
		} finally {
			setBusy(false)
		}
	}

	if (!config) {
		return (
			<div className="mb-8 p-4 bg-white rounded-lg">
				<Typography>Loading experiment settings…</Typography>
			</div>
		)
	}

	return (
		<div className="mb-8 p-4 bg-white rounded-lg border border-blue-gray-100">
			<Typography variant="h5" color="blue" className="mb-4">
				Experiment &amp; archive
			</Typography>
			<p className="text-sm text-gray-600 mb-4">
				Operational dashboards and exports use the active experiment (
				<code>archived == false</code> and matching <code>experimentId</code>
				). Backfill assigns cohort by createdDate: before 2025 → 2024-pilot;
				2025 → 2025-main; 2026+ → active experiment. Default archive
				cutoff: {DEFAULT_ARCHIVE_CUTOFF_ISO}.
			</p>

			<div className="flex flex-col gap-4 max-w-xl">
				<label className="flex flex-col gap-1">
					<span className="text-sm font-medium">Active experiment</span>
					<select
						className="border rounded px-2 py-1"
						value={selectedExperimentId}
						onChange={(e) => setSelectedExperimentId(e.target.value)}>
						{(config.experiments || []).map((exp) => (
							<option key={exp.id} value={exp.id}>
								{exp.label} ({exp.id})
							</option>
						))}
					</select>
				</label>
				<Button
					size="sm"
					color="blue"
					disabled={busy}
					onClick={handleSetActiveExperiment}>
					Save active experiment
				</Button>

				<div className="border-t border-blue-gray-100 pt-4 mt-2">
					<p className="text-sm font-medium mb-2">Add study wave</p>
					<p className="text-xs text-gray-500 mb-3">
						Registers a new experiment in <code>settings/experiment</code> so it
						appears in the dropdown. New reports use whichever experiment is
						active when they are created.
					</p>
					<div className="flex flex-col gap-2">
						<label className="flex flex-col gap-1">
							<span className="text-sm">Experiment id</span>
							<input
								type="text"
								className="border rounded px-2 py-1 font-mono text-sm"
								placeholder="2027-main"
								value={newExperimentId}
								onChange={(e) => setNewExperimentId(e.target.value)}
							/>
						</label>
						<label className="flex flex-col gap-1">
							<span className="text-sm">Label</span>
							<input
								type="text"
								className="border rounded px-2 py-1"
								placeholder="2027 study"
								value={newExperimentLabel}
								onChange={(e) => setNewExperimentLabel(e.target.value)}
							/>
						</label>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={setNewAsActive}
								onChange={(e) => setSetNewAsActive(e.target.checked)}
							/>
							Set as active experiment
						</label>
						<Button
							size="sm"
							variant="outlined"
							disabled={
								busy ||
								!newExperimentId.trim() ||
								!newExperimentLabel.trim()
							}
							onClick={handleAddExperiment}>
							Add experiment
						</Button>
					</div>
				</div>

				{metrics && (
					<div className="text-sm text-gray-700">
						<p>
							<strong>Current cohort metrics</strong> (
							{metrics.experimentId}): {metrics.submittedCount} submitted,{' '}
							{metrics.scrapedCount} scraped/piped
						</p>
					</div>
				)}

				<label className="flex flex-col gap-1">
					<span className="text-sm font-medium">Archive cutoff date</span>
					<input
						type="date"
						className="border rounded px-2 py-1"
						value={cutoffDate}
						onChange={(e) => setCutoffDate(e.target.value)}
					/>
				</label>
				<div className="flex flex-wrap gap-2">
					<Button
						size="sm"
						variant="outlined"
						disabled={busy}
						onClick={handlePreviewArchive}>
						Preview archive count
					</Button>
					<Button
						size="sm"
						color="red"
						variant="outlined"
						disabled={busy}
						onClick={handleBulkArchive}>
						Archive before cutoff
					</Button>
					<Button
						size="sm"
						variant="outlined"
						disabled={busy}
						onClick={handleBackfill}>
						Initialize experiment fields
					</Button>
				</div>
				{previewCount !== null && (
					<p className="text-sm">Preview: {previewCount} report(s)</p>
				)}
				{status && (
					<p className={`text-sm ${globalStyles.text?.default || ''}`}>
						{status}
					</p>
				)}
				<p className="text-xs text-gray-500">
					External tools: query <code>reports</code> with{' '}
					<code>archived == false</code> and{' '}
					<code>experimentId == &quot;{selectedExperimentId}&quot;</code>, or
					call the <code>getExperimentMetrics</code> Cloud Function. See{' '}
					<code>technicalDocumentation.md</code>.
				</p>
			</div>
		</div>
	)
}

export default ExperimentSettings
