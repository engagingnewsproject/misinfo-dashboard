/**
 * Admin Appearance settings — report table chrome, reporting flow, login copy.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Button, Checkbox, Typography } from '@material-tailwind/react'
import { db } from '../../config/firebase'
import {
	DEFAULT_APPEARANCE_CONFIG,
	getAppearanceConfig,
	saveAppearanceConfig,
} from '../../utils/appearance-config'
import LoginBlurbSettings from './LoginBlurbSettings'

/**
 * @param {{ bg: string, hover: string }} row
 */
function ColorPreview({ bg, hover }) {
	const [hovered, setHovered] = useState(false)
	return (
		<div
			className="rounded-md border border-blue-gray-100 px-4 py-3 text-sm text-gray-700 transition-colors"
			style={{ backgroundColor: hovered ? hover : bg }}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}>
			Investigation row preview (hover to see hover color)
		</div>
	)
}

const Appearance = () => {
	const [bg, setBg] = useState(
		DEFAULT_APPEARANCE_CONFIG.reportTable.investigationRow.bg,
	)
	const [hover, setHover] = useState(
		DEFAULT_APPEARANCE_CONFIG.reportTable.investigationRow.hover,
	)
	const [showReminderLive, setShowReminderLive] = useState(
		DEFAULT_APPEARANCE_CONFIG.reporting.showReminderStep.live,
	)
	const [showReminderStudy, setShowReminderStudy] = useState(
		DEFAULT_APPEARANCE_CONFIG.reporting.showReminderStep.study,
	)
	const [loading, setLoading] = useState(true)
	const [busy, setBusy] = useState(false)
	const [status, setStatus] = useState('')
	const [reportingBusy, setReportingBusy] = useState(false)
	const [reportingStatus, setReportingStatus] = useState('')

	const loadConfig = useCallback(async () => {
		setLoading(true)
		setStatus('')
		setReportingStatus('')
		try {
			const config = await getAppearanceConfig(db)
			setBg(config.reportTable.investigationRow.bg)
			setHover(config.reportTable.investigationRow.hover)
			setShowReminderLive(config.reporting.showReminderStep.live)
			setShowReminderStudy(config.reporting.showReminderStep.study)
		} catch (err) {
			console.error(err)
			setStatus('Failed to load appearance settings.')
			setReportingStatus('Failed to load reporting settings.')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadConfig()
	}, [loadConfig])

	const handleSave = async () => {
		setBusy(true)
		setStatus('')
		try {
			const saved = await saveAppearanceConfig(db, {
				reportTable: {
					investigationRow: { bg, hover },
				},
			})
			setBg(saved.reportTable.investigationRow.bg)
			setHover(saved.reportTable.investigationRow.hover)
			setStatus('Appearance settings saved.')
		} catch (err) {
			console.error(err)
			setStatus('Failed to save appearance settings.')
		} finally {
			setBusy(false)
		}
	}

	const handleReset = () => {
		setBg(DEFAULT_APPEARANCE_CONFIG.reportTable.investigationRow.bg)
		setHover(DEFAULT_APPEARANCE_CONFIG.reportTable.investigationRow.hover)
		setStatus('Reset to defaults (not saved yet).')
	}

	const handleReportingSave = async () => {
		setReportingBusy(true)
		setReportingStatus('')
		try {
			const saved = await saveAppearanceConfig(db, {
				reporting: {
					showReminderStep: {
						live: showReminderLive,
						study: showReminderStudy,
					},
				},
			})
			setShowReminderLive(saved.reporting.showReminderStep.live)
			setShowReminderStudy(saved.reporting.showReminderStep.study)
			setReportingStatus('Reporting settings saved.')
		} catch (err) {
			console.error(err)
			setReportingStatus('Failed to save reporting settings.')
		} finally {
			setReportingBusy(false)
		}
	}

	const handleReportingReset = () => {
		setShowReminderLive(DEFAULT_APPEARANCE_CONFIG.reporting.showReminderStep.live)
		setShowReminderStudy(DEFAULT_APPEARANCE_CONFIG.reporting.showReminderStep.study)
		setReportingStatus('Reset to defaults (not saved yet).')
	}

	return (
		<div data-component="Appearance" className="p-6 max-w-3xl">
			<Typography variant="h4" color="blue" className="mb-2">
				Appearance
			</Typography>
			<p className="text-sm text-gray-600 mb-6">
				Configure shared dashboard colors, reporting flow, and public login page
				copy. Changes apply for all users.
			</p>

			<LoginBlurbSettings />

			<div className="mb-8 p-6 bg-white rounded-md border border-blue-gray-100">
				<Typography variant="h5" color="blue" className="mb-4">
					Reporting Settings
				</Typography>
				<p className="text-sm text-gray-600 mb-4">
					Control the Reminder step at the start of a new report. Live and study
					sites for this product share one Firebase project, so both toggles are
					here. Each site only uses its own flag.
				</p>

				{loading ? (
					<p className="text-sm text-gray-500">Loading…</p>
				) : (
					<div className="flex flex-col gap-3 max-w-md">
						<Checkbox
							color="blue"
							checked={showReminderLive}
							onChange={(e) => setShowReminderLive(e.target.checked)}
							label="Show reminder (live)"
							containerProps={{ className: '-ml-2' }}
						/>
						<Checkbox
							color="blue"
							checked={showReminderStudy}
							onChange={(e) => setShowReminderStudy(e.target.checked)}
							label="Show reminder (study)"
							containerProps={{ className: '-ml-2' }}
						/>

						<div className="flex flex-wrap gap-2 pt-2">
							<Button
								size="sm"
								color="blue"
								disabled={reportingBusy}
								onClick={handleReportingSave}>
								Save
							</Button>
							<Button
								size="sm"
								variant="outlined"
								disabled={reportingBusy}
								onClick={handleReportingReset}>
								Reset to defaults
							</Button>
						</div>

						{reportingStatus && (
							<p className="text-sm text-gray-600" role="status">
								{reportingStatus}
							</p>
						)}
					</div>
				)}
			</div>

			<div className="mb-8 p-6 bg-white rounded-md border border-blue-gray-100">
				<Typography variant="h5" color="blue" className="mb-4">
					Report table
				</Typography>
				<p className="text-sm text-gray-600 mb-4">
					Highlight color for rows labeled &quot;To Investigate&quot; (or missing a
					label).
				</p>

				{loading ? (
					<p className="text-sm text-gray-500">Loading…</p>
				) : (
					<div className="flex flex-col gap-4 max-w-md">
						<label className="flex flex-col gap-1">
							<span className="text-sm font-medium text-gray-700">
								Investigation row background
							</span>
							<input
								type="color"
								value={bg}
								onChange={(e) => setBg(e.target.value)}
								className="h-10 w-full cursor-pointer rounded-md border border-gray-200"
								aria-label="Investigation row background"
							/>
							<span className="text-xs font-mono text-gray-500">{bg}</span>
						</label>

						<label className="flex flex-col gap-1">
							<span className="text-sm font-medium text-gray-700">
								Investigation row hover
							</span>
							<input
								type="color"
								value={hover}
								onChange={(e) => setHover(e.target.value)}
								className="h-10 w-full cursor-pointer rounded-md border border-gray-200"
								aria-label="Investigation row hover"
							/>
							<span className="text-xs font-mono text-gray-500">{hover}</span>
						</label>

						<ColorPreview bg={bg} hover={hover} />

						<div className="flex flex-wrap gap-2 pt-2">
							<Button
								size="sm"
								color="blue"
								disabled={busy}
								onClick={handleSave}>
								Save
							</Button>
							<Button
								size="sm"
								variant="outlined"
								disabled={busy}
								onClick={handleReset}>
								Reset to defaults
							</Button>
						</div>

						{status && (
							<p className="text-sm text-gray-600" role="status">
								{status}
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

export default Appearance
