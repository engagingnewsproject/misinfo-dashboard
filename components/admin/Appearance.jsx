/**
 * Admin Appearance settings — report table chrome and future UI tokens.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Button, Typography } from '@material-tailwind/react'
import { db } from '../../config/firebase'
import {
	DEFAULT_APPEARANCE_CONFIG,
	getAppearanceConfig,
	saveAppearanceConfig,
} from '../../utils/appearance-config'

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
	const [loading, setLoading] = useState(true)
	const [busy, setBusy] = useState(false)
	const [status, setStatus] = useState('')

	const loadConfig = useCallback(async () => {
		setLoading(true)
		setStatus('')
		try {
			const config = await getAppearanceConfig(db)
			setBg(config.reportTable.investigationRow.bg)
			setHover(config.reportTable.investigationRow.hover)
		} catch (err) {
			console.error(err)
			setStatus('Failed to load appearance settings.')
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

	return (
		<div className="p-6 max-w-3xl">
			<Typography variant="h4" color="blue" className="mb-2">
				Appearance
			</Typography>
			<p className="text-sm text-gray-600 mb-6">
				Configure shared dashboard colors. Changes apply for all signed-in users.
			</p>

			<div className="mb-8 p-6 bg-white rounded-lg border border-blue-gray-100">
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
