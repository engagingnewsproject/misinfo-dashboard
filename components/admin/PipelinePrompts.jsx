/**
 * Admin view/edit for Truth Sleuth LLM system prompts (Firestore `settings/pipelinePrompts`).
 * Readonly by default; Edit → Save applies on the next nightly run.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Button, Typography } from '@material-tailwind/react'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import {
	PIPELINE_PROMPT_FIELDS,
	clearPromptOverride,
	effectivePromptText,
	getPipelinePrompts,
	normalizePipelinePrompts,
	savePipelinePrompts,
	validatePromptText,
} from '../../utils/pipeline-prompts'

const PipelinePrompts = () => {
	const { user } = useAuth()
	const [stored, setStored] = useState(() => normalizePipelinePrompts(null))
	const [loading, setLoading] = useState(true)
	const [busyKey, setBusyKey] = useState('')
	const [editingKey, setEditingKey] = useState('')
	const [draft, setDraft] = useState('')
	const [status, setStatus] = useState('')

	const loadPrompts = useCallback(async () => {
		setLoading(true)
		setStatus('')
		try {
			const next = await getPipelinePrompts(db)
			setStored(next)
		} catch (err) {
			console.error(err)
			setStatus('Failed to load pipeline prompts.')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadPrompts()
	}, [loadPrompts])

	const meta = {
		updatedBy: user?.uid || user?.accountId || '',
	}

	const startEdit = (key) => {
		const { text } = effectivePromptText(stored, key)
		setEditingKey(key)
		setDraft(text)
		setStatus('')
	}

	const cancelEdit = () => {
		setEditingKey('')
		setDraft('')
		setStatus('')
	}

	const handleSave = async (key) => {
		const validationError = validatePromptText(key, draft)
		if (validationError) {
			setStatus(validationError)
			return
		}
		setBusyKey(key)
		setStatus('')
		try {
			const next = await savePipelinePrompts(db, { [key]: draft }, meta)
			setStored(next)
			setEditingKey('')
			setDraft('')
			setStatus('Prompt saved. It applies to the next nightly run.')
		} catch (err) {
			console.error(err)
			setStatus(
				err instanceof Error && err.message
					? err.message
					: 'Failed to save prompt.',
			)
		} finally {
			setBusyKey('')
		}
	}

	const handleReset = async (key) => {
		setBusyKey(key)
		setStatus('')
		try {
			await clearPromptOverride(db, key, meta)
			const next = await getPipelinePrompts(db)
			setStored(next)
			if (editingKey === key) {
				setEditingKey('')
				setDraft('')
			}
			setStatus('Reset to job default. Applies to the next nightly run.')
		} catch (err) {
			console.error(err)
			setStatus(
				err instanceof Error && err.message
					? err.message
					: 'Failed to reset prompt.',
			)
		} finally {
			setBusyKey('')
		}
	}

	return (
		<div
			data-component="PipelinePrompts"
			className="mb-6 rounded-md border border-blue-gray-100 bg-white p-6">
			<Typography variant="h5" color="blue" className="mb-2">
				LLM prompts
			</Typography>
			<p className="mb-4 text-sm text-gray-600">
				System prompts used by the nightly Truth Sleuth job for election
				classification, swing-state relevance, and meatiness ranking. View the live
				text below. Admins can edit and save; changes apply to the next nightly run.
				Empty / reset uses the job repo default.
			</p>

			{loading ? (
				<p className="text-sm text-gray-500">Loading…</p>
			) : (
				<div className="flex flex-col gap-8">
					{PIPELINE_PROMPT_FIELDS.map((field) => {
						const { text, isOverride } = effectivePromptText(stored, field.key)
						const isEditing = editingKey === field.key
						const busy = busyKey === field.key
						return (
							<section
								key={field.key}
								className="flex flex-col gap-2"
								aria-labelledby={`prompt-${field.key}-title`}>
								<div className="flex flex-wrap items-center gap-2">
									<Typography
										id={`prompt-${field.key}-title`}
										variant="h6"
										className="mb-0 text-base font-semibold text-blue-gray-800">
										{field.label}
									</Typography>
									<span
										className={
											isOverride
												? 'rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800'
												: 'rounded bg-blue-gray-50 px-2 py-0.5 text-xs font-medium text-blue-gray-600'
										}>
										{isOverride ? 'Custom override' : 'Job default'}
									</span>
								</div>
								<p className="text-sm text-gray-600">{field.description}</p>
								<textarea
									id={`pipeline-prompt-${field.key}`}
									className="min-h-[12rem] w-full rounded-md border border-blue-gray-200 bg-blue-gray-50/40 p-3 font-mono text-xs leading-relaxed text-blue-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-default disabled:opacity-100"
									value={isEditing ? draft : text}
									readOnly={!isEditing}
									disabled={busy && !isEditing}
									onChange={(e) => setDraft(e.target.value)}
									spellCheck={false}
								/>
								<div className="flex flex-wrap gap-2">
									{isEditing ? (
										<>
											<Button
												size="sm"
												color="blue"
												disabled={busy}
												onClick={() => handleSave(field.key)}>
												Save
											</Button>
											<Button
												size="sm"
												variant="outlined"
												color="blue-gray"
												disabled={busy}
												onClick={cancelEdit}>
												Cancel
											</Button>
										</>
									) : (
										<Button
											size="sm"
											color="blue"
											disabled={Boolean(editingKey) || Boolean(busyKey)}
											onClick={() => startEdit(field.key)}>
											Edit
										</Button>
									)}
									{isOverride && (
										<Button
											size="sm"
											variant="outlined"
											color="amber"
											disabled={busy || (Boolean(editingKey) && !isEditing)}
											onClick={() => handleReset(field.key)}>
											Reset to job default
										</Button>
									)}
								</div>
							</section>
						)
					})}

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

export default PipelinePrompts
