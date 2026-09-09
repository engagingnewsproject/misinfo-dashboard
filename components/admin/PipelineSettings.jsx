/**
 * Admin controls for nightly Truth Sleuth knobs (Firestore `settings/pipeline`).
 * Changes apply on the next scheduled run; Cloud Run env remains the deploy baseline.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Switch, Typography } from '@material-tailwind/react'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import FormInput from '../ui/FormInput'
import {
	PIPELINE_SETTING_FIELDS,
	PROD_DEFAULTS,
	getPipelineConfig,
	savePipelineConfig,
	validatePipelineConfig,
} from '../../utils/pipeline-config'

/**
 * @param {import('../../utils/pipeline-config').PipelineConfig} config
 * @param {keyof import('../../utils/pipeline-config').PipelineConfig} key
 * @param {unknown} value
 */
function setField(config, key, value) {
	return { ...config, [key]: value }
}

const PipelineSettings = () => {
	const { user } = useAuth()
	const [config, setConfig] = useState(() => ({ ...PROD_DEFAULTS }))
	const [loading, setLoading] = useState(true)
	const [busy, setBusy] = useState(false)
	const [status, setStatus] = useState('')

	const loadConfig = useCallback(async () => {
		setLoading(true)
		setStatus('')
		try {
			const next = await getPipelineConfig(db)
			setConfig(next)
		} catch (err) {
			console.error(err)
			setStatus('Failed to load pipeline settings.')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadConfig()
	}, [loadConfig])

	const groups = useMemo(() => {
		/** @type {Map<string, typeof PIPELINE_SETTING_FIELDS>} */
		const map = new Map()
		for (const field of PIPELINE_SETTING_FIELDS) {
			const group = field.group || 'Settings'
			if (!map.has(group)) map.set(group, [])
			map.get(group).push(field)
		}
		return [...map.entries()]
	}, [])

	const handleSave = async () => {
		const validationError = validatePipelineConfig(config)
		if (validationError) {
			setStatus(validationError)
			return
		}
		setBusy(true)
		setStatus('')
		try {
			const saved = await savePipelineConfig(db, config, {
				updatedBy: user?.uid || user?.accountId || '',
			})
			setConfig(saved)
			setStatus('Pipeline settings saved. They apply to the next nightly run.')
		} catch (err) {
			console.error(err)
			setStatus(
				err instanceof Error && err.message
					? err.message
					: 'Failed to save pipeline settings.',
			)
		} finally {
			setBusy(false)
		}
	}

	return (
		<div
			data-component="PipelineSettings"
			className="mb-6 rounded-md border border-blue-gray-100 bg-white p-6">
			<Typography variant="h5" color="blue" className="mb-2">
				Pipeline settings
			</Typography>
			<p className="mb-4 text-sm text-gray-600">
				Day-to-day knobs for the nightly Truth Sleuth job. Saved values live in
				Firestore and override the Cloud Run env for the next run. The deploy
				env file remains the baseline (and can still hard-disable Firestore
				import).
			</p>

			{loading ? (
				<p className="text-sm text-gray-500">Loading…</p>
			) : (
				<div className="flex max-w-2xl flex-col gap-6">
					{groups.map(([groupName, fields]) => (
						<section key={groupName} className="flex flex-col gap-4">
							<Typography
								variant="h6"
								className="text-sm font-semibold uppercase tracking-wide text-gray-500">
								{groupName}
							</Typography>
							{fields.map((field) => {
								const value = config[field.key]
								return (
									<div key={field.key} className="flex flex-col gap-1.5">
										{field.type === 'switch' ? (
											<div className="flex items-center gap-3">
												<Switch
													checked={Boolean(value)}
													onChange={(e) =>
														setConfig((prev) =>
															setField(prev, field.key, e.target.checked),
														)
													}
													color="blue"
													crossOrigin={undefined}
												/>
												<Typography variant="small" className="mb-0 font-medium">
													{field.label}
												</Typography>
											</div>
										) : (
											<FormInput
												id={`pipeline-${field.key}`}
												label={field.label}
												type={field.type === 'number' ? 'number' : 'text'}
												value={value == null ? '' : String(value)}
												onChange={(e) => {
													const raw = e.target.value
													if (field.type === 'number') {
														const n = Number(raw)
														setConfig((prev) =>
															setField(
																prev,
																field.key,
																Number.isFinite(n) ? n : prev[field.key],
															),
														)
														return
													}
													setConfig((prev) => setField(prev, field.key, raw))
												}}
												min={field.type === 'number' ? 1 : undefined}
											/>
										)}
										<p className="text-sm text-gray-600">{field.description}</p>
										<p className="text-xs text-gray-500">
											Job default (prod): {field.defaultLabel}
										</p>
									</div>
								)
							})}
						</section>
					))}

					<div className="flex flex-wrap gap-2 pt-1">
						<Button size="sm" color="blue" disabled={busy} onClick={handleSave}>
							Save
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
	)
}

export default PipelineSettings
